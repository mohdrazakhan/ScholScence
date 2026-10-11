-- ==============================================================================
-- SchoolSense — Department Overviews Optimization RPCs
-- Eliminates dozens of parallel API calls by providing 1 single summary & data
-- API per page for:
-- 1. get_departmental_users_overview -> 1 single call for Departmental Users page
-- 2. get_fees_management_overview   -> 1 single call for Fees & Invoicing page
-- 3. get_transport_department_overview -> 1 single call for Transport & Fleet page
-- ==============================================================================

SET search_path = public, extensions;

-- ==============================================================================
-- 0. SCHEMA PREREQUISITES & PERMISSION GRANTS
-- Ensures department, designation & permissions columns exist and table SELECT
-- privileges are granted so SECURITY DEFINER and PostgREST can execute freely.
-- ==============================================================================

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS designation text,
  ADD COLUMN IF NOT EXISTS custom_permissions jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.user_school_roles 
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS designation text,
  ADD COLUMN IF NOT EXISTS custom_permissions jsonb DEFAULT '[]'::jsonb;

GRANT SELECT ON public.users TO authenticated, anon, service_role;
GRANT SELECT ON public.user_school_roles TO authenticated, anon, service_role;
GRANT SELECT ON public.roles TO authenticated, anon, service_role;

-- ==============================================================================
-- 1. DEPARTMENTAL USERS OVERVIEW RPC
-- Replaces multiple direct queries to users, user_school_roles, roles, guardians
-- and bypasses users RLS 403 Forbidden safely via SECURITY DEFINER.
-- ==============================================================================

DROP FUNCTION IF EXISTS public.get_departmental_users_overview(TEXT);
DROP FUNCTION IF EXISTS public.get_departmental_users_overview(UUID);

CREATE OR REPLACE FUNCTION public.get_departmental_users_overview(
  p_school_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id UUID := NULL;
  v_users_list JSONB := '[]'::JSONB;
  v_roles_list JSONB := '[]'::JSONB;
  v_total_users INT := 0;
  v_active_users INT := 0;
  v_fee_users INT := 0;
  v_transport_users INT := 0;
  v_admin_users INT := 0;
  v_specialized_users INT := 0;
  v_result JSONB;
BEGIN
  -- 0. Enforce Anti-Postman / Request Signature & Session Verification
  IF NOT public.verify_request_signature(NULL, NULL, NULL) OR public.current_session() IS NULL THEN
    RETURN public.unauthorized_api_response();
  END IF;

  -- 1. Resolve school id (server-derived unless platform admin)
  IF public.is_platform_admin() AND p_school_id IS NOT NULL AND TRIM(p_school_id) != '' THEN
    BEGIN
      v_school_id := p_school_id::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_school_id := NULL;
    END;
  END IF;

  IF v_school_id IS NULL THEN
    v_school_id := public.current_school_id();
  END IF;

  IF v_school_id IS NULL THEN
    RETURN public.unauthorized_api_response();
  END IF;

  -- 2. Fetch Departmental Users for this school (excluding students, parents, teachers)
  SELECT COALESCE(jsonb_agg(user_row), '[]'::JSONB)
  INTO v_users_list
  FROM (
    SELECT
      u.id,
      v_school_id AS school_id,
      u.first_name,
      COALESCE(u.last_name, '') AS last_name,
      TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS name,
      u.email,
      COALESCE(u.phone, '') AS phone,
      COALESCE(usr.department, u.department, 
        CASE 
          WHEN r.code = 'FEE_MANAGER' THEN 'Fee & Accounts'
          WHEN r.code = 'TRANSPORT_MANAGER' THEN 'Transport & Fleet'
          WHEN r.code = 'SCHOOL_ADMIN' THEN 'Administration'
          WHEN r.code = 'LIBRARIAN' THEN 'Library & Resources'
          WHEN r.code = 'SPORTS_DIRECTOR' THEN 'Sports & Physical Education'
          WHEN r.code = 'RECEPTIONIST' THEN 'Front Desk & Reception'
          WHEN r.code = 'SECURITY_STAFF' THEN 'Security & Safety'
          ELSE 'Administration'
        END
      ) AS department,
      COALESCE(usr.designation, u.designation, r.name, r.code, 'Staff Member') AS designation,
      COALESCE(r.code, 'STAFF') AS role,
      COALESCE(r.name, r.code, 'Staff') AS role_name,
      COALESCE(usr.custom_permissions, u.custom_permissions, '[]'::JSONB) AS custom_permissions,
      COALESCE(usr.status, u.status, 'ACTIVE') AS status,
      u.last_login_at AS last_login,
      u.created_at,
      u.updated_at
    FROM public.user_school_roles usr
    JOIN public.users u ON u.id = usr.user_id
    LEFT JOIN public.roles r ON r.id = usr.role_id
    WHERE usr.school_id = v_school_id
      AND usr.deleted_at IS NULL
      AND u.deleted_at IS NULL
      AND COALESCE(r.code, '') NOT IN ('STUDENT', 'PARENT', 'GUARDIAN', 'TEACHER', 'CLASS_TEACHER')
      AND LOWER(u.email) != 'admin@schoolscence.in'
      AND NOT EXISTS (
        SELECT 1 FROM public.guardians g WHERE g.user_id = u.id AND g.school_id = v_school_id
      )
    ORDER BY u.created_at DESC
  ) user_row;

  -- 3. Calculate Counts
  SELECT
    COALESCE(jsonb_array_length(v_users_list), 0),
    COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(v_users_list) elm WHERE elm->>'status' = 'ACTIVE'), 0),
    COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(v_users_list) elm WHERE (elm->>'department' ILIKE '%Fee%' OR elm->>'department' ILIKE '%Account%' OR elm->>'role' = 'FEE_MANAGER')), 0),
    COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(v_users_list) elm WHERE (elm->>'department' ILIKE '%Transport%' OR elm->>'role' = 'TRANSPORT_MANAGER')), 0),
    COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(v_users_list) elm WHERE (elm->>'department' ILIKE '%Admin%' OR elm->>'role' = 'SCHOOL_ADMIN')), 0),
    COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(v_users_list) elm WHERE (elm->>'department' ILIKE '%Library%' OR elm->>'department' ILIKE '%Sport%' OR elm->>'department' ILIKE '%Reception%' OR elm->>'department' ILIKE '%Security%')), 0)
  INTO v_total_users, v_active_users, v_fee_users, v_transport_users, v_admin_users, v_specialized_users;

  -- 4. Available roles list
  SELECT COALESCE(jsonb_agg(role_row), '[]'::JSONB)
  INTO v_roles_list
  FROM (
    SELECT id, code, name, description
    FROM public.roles
    WHERE code NOT IN ('STUDENT', 'PARENT', 'GUARDIAN', 'TEACHER', 'CLASS_TEACHER')
    ORDER BY name ASC
  ) role_row;

  v_result := jsonb_build_object(
    'success', true,
    'stats', jsonb_build_object(
      'totalUsers', v_total_users,
      'activeUsers', v_active_users,
      'feeUsers', v_fee_users,
      'transportUsers', v_transport_users,
      'adminUsers', v_admin_users,
      'specializedUsers', v_specialized_users
    ),
    'users', v_users_list,
    'availableRoles', v_roles_list
  );

  RETURN v_result;
END;
$$;

-- ==============================================================================
-- 2. FEES MANAGEMENT OVERVIEW RPC
-- Replaces 23+ parallel queries to fee_structures, fee_invoices, classes,
-- sections, student_enrollments with 1 single optimized JSON response.
-- ==============================================================================

DROP FUNCTION IF EXISTS public.get_fees_management_overview(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_fees_management_overview(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_fees_management_overview(
  p_school_id TEXT DEFAULT NULL,
  p_academic_year_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id UUID := NULL;
  v_active_year_id UUID := NULL;
  v_total_expected NUMERIC(12, 2) := 0.00;
  v_total_collected NUMERIC(12, 2) := 0.00;
  v_pending_dues NUMERIC(12, 2) := 0.00;
  v_overdue_count INT := 0;
  v_collection_rate NUMERIC(5, 2) := 0.00;
  v_invoices_list JSONB := '[]'::JSONB;
  v_structures_list JSONB := '[]'::JSONB;
  v_categories_list JSONB := '[]'::JSONB;
  v_classes_list JSONB := '[]'::JSONB;
  v_result JSONB;
BEGIN
  -- 0. Enforce Anti-Postman / Request Signature & Session Verification
  IF NOT public.verify_request_signature(NULL, NULL, NULL) OR public.current_session() IS NULL THEN
    RETURN public.unauthorized_api_response();
  END IF;

  -- 1. Resolve school id (server-derived unless platform admin)
  IF public.is_platform_admin() AND p_school_id IS NOT NULL AND TRIM(p_school_id) != '' THEN
    BEGIN v_school_id := p_school_id::UUID; EXCEPTION WHEN OTHERS THEN v_school_id := NULL; END;
  END IF;
  IF v_school_id IS NULL THEN
    v_school_id := public.current_school_id();
  END IF;
  IF v_school_id IS NULL THEN
    RETURN public.unauthorized_api_response();
  END IF;

  -- 2. Resolve academic session
  IF p_academic_year_id IS NOT NULL AND TRIM(p_academic_year_id) != '' THEN
    BEGIN v_active_year_id := p_academic_year_id::UUID; EXCEPTION WHEN OTHERS THEN v_active_year_id := NULL; END;
  END IF;

  IF v_active_year_id IS NULL AND v_school_id IS NOT NULL THEN
    SELECT id INTO v_active_year_id
    FROM public.academic_years
    WHERE school_id = v_school_id AND is_current = TRUE AND deleted_at IS NULL
    LIMIT 1;

    IF v_active_year_id IS NULL THEN
      SELECT id INTO v_active_year_id
      FROM public.academic_years
      WHERE school_id = v_school_id AND deleted_at IS NULL
      ORDER BY created_at DESC LIMIT 1;
    END IF;
  END IF;

  -- 3. Calculate Summary Financial Metrics
  SELECT
    COALESCE(SUM(total_amount), 0.00),
    COALESCE(SUM(paid_amount), 0.00),
    COALESCE(SUM(GREATEST(0, total_amount - paid_amount)), 0.00),
    COALESCE(COUNT(*) FILTER (WHERE status = 'OVERDUE' OR (status = 'UNPAID' AND due_date < CURRENT_DATE)), 0)
  INTO v_total_expected, v_total_collected, v_pending_dues, v_overdue_count
  FROM public.student_fee_invoices
  WHERE school_id = v_school_id
    AND (v_active_year_id IS NULL OR academic_year_id = v_active_year_id)
    AND deleted_at IS NULL;

  IF v_total_expected > 0 THEN
    v_collection_rate := ROUND((v_total_collected / v_total_expected) * 100, 1);
  ELSE
    v_collection_rate := 0.00;
  END IF;

  -- 4. Invoices List with Student, Class, and Section safely joined
  SELECT COALESCE(jsonb_agg(inv_row), '[]'::JSONB)
  INTO v_invoices_list
  FROM (
    SELECT
      i.id,
      i.school_id,
      i.academic_year_id,
      i.student_id,
      i.invoice_number,
      COALESCE(i.month_name, 'Current Month') AS month_name,
      i.total_amount,
      i.paid_amount,
      i.discount_amount,
      i.fine_amount,
      i.due_date,
      i.status,
      COALESCE(i.items, '[]'::JSONB) AS items,
      i.created_at,
      TRIM(CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))) AS student_name,
      COALESCE(s.admission_number, '') AS admission_number,
      COALESCE(c.name, 'Class') AS class_name,
      COALESCE(sec.name, 'Section A') AS section_name
    FROM public.student_fee_invoices i
    JOIN public.students s ON s.id = i.student_id
    LEFT JOIN LATERAL (
      SELECT se.class_id, se.section_id
      FROM public.student_enrollments se
      WHERE se.student_id = s.id
        AND (v_active_year_id IS NULL OR se.academic_year_id = v_active_year_id)
        AND se.status = 'ACTIVE'
      ORDER BY se.created_at DESC
      LIMIT 1
    ) enroll ON true
    LEFT JOIN public.classes c ON c.id = enroll.class_id
    LEFT JOIN public.sections sec ON sec.id = enroll.section_id
    WHERE i.school_id = v_school_id
      AND (v_active_year_id IS NULL OR i.academic_year_id = v_active_year_id)
      AND i.deleted_at IS NULL
    ORDER BY i.created_at DESC
    LIMIT 200
  ) inv_row;

  -- 5. Structures List for current session
  SELECT COALESCE(jsonb_agg(str_row), '[]'::JSONB)
  INTO v_structures_list
  FROM (
    SELECT
      fs.id,
      fs.school_id,
      fs.academic_year_id,
      fs.class_id,
      fs.fee_category_id,
      fs.amount,
      fs.frequency,
      fs.due_day,
      fs.status,
      c.name AS class_name,
      fc.name AS category_name
    FROM public.fee_structures fs
    LEFT JOIN public.classes c ON c.id = fs.class_id
    LEFT JOIN public.fee_categories fc ON fc.id = fs.fee_category_id
    WHERE fs.school_id = v_school_id
      AND (v_active_year_id IS NULL OR fs.academic_year_id = v_active_year_id)
      AND fs.deleted_at IS NULL
    ORDER BY c.display_order ASC, fc.name ASC
  ) str_row;

  -- 6. Fee Categories Catalog
  SELECT COALESCE(jsonb_agg(cat_row), '[]'::JSONB)
  INTO v_categories_list
  FROM (
    SELECT id, name, description, status
    FROM public.fee_categories
    WHERE school_id = v_school_id AND deleted_at IS NULL
    ORDER BY name ASC
  ) cat_row;

  -- 7. Classes List for selection dropdowns
  SELECT COALESCE(jsonb_agg(cls_row), '[]'::JSONB)
  INTO v_classes_list
  FROM (
    SELECT id, name, code, display_order
    FROM public.classes
    WHERE school_id = v_school_id AND deleted_at IS NULL
    ORDER BY display_order ASC, name ASC
  ) cls_row;

  v_result := jsonb_build_object(
    'success', true,
    'overview', jsonb_build_object(
      'totalExpected', v_total_expected,
      'totalCollected', v_total_collected,
      'pendingDues', v_pending_dues,
      'overdueCount', v_overdue_count,
      'collectionRate', v_collection_rate
    ),
    'invoices', v_invoices_list,
    'structures', v_structures_list,
    'categories', v_categories_list,
    'classes', v_classes_list
  );

  RETURN v_result;
END;
$$;

-- ==============================================================================
-- 3. TRANSPORT DEPARTMENT OVERVIEW RPC
-- Replaces 18+ parallel queries to transport_vehicles, transport_routes,
-- transport_stops, student_transport_assignments with 1 single response.
-- ==============================================================================

DROP FUNCTION IF EXISTS public.get_transport_department_overview(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_transport_department_overview(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_transport_department_overview(
  p_school_id TEXT DEFAULT NULL,
  p_academic_year_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id UUID := NULL;
  v_active_year_id UUID := NULL;
  v_total_vehicles INT := 0;
  v_active_routes INT := 0;
  v_total_stops INT := 0;
  v_active_passes INT := 0;
  v_total_capacity INT := 0;
  v_occupancy_rate NUMERIC(5, 2) := 0.00;
  v_vehicles_list JSONB := '[]'::JSONB;
  v_routes_list JSONB := '[]'::JSONB;
  v_stops_list JSONB := '[]'::JSONB;
  v_passes_list JSONB := '[]'::JSONB;
  v_classes_list JSONB := '[]'::JSONB;
  v_result JSONB;
BEGIN
  -- 0. Enforce Anti-Postman / Request Signature & Session Verification
  IF NOT public.verify_request_signature(NULL, NULL, NULL) OR public.current_session() IS NULL THEN
    RETURN public.unauthorized_api_response();
  END IF;

  -- 1. Resolve school id (server-derived unless platform admin)
  IF public.is_platform_admin() AND p_school_id IS NOT NULL AND TRIM(p_school_id) != '' THEN
    BEGIN v_school_id := p_school_id::UUID; EXCEPTION WHEN OTHERS THEN v_school_id := NULL; END;
  END IF;
  IF v_school_id IS NULL THEN
    v_school_id := public.current_school_id();
  END IF;
  IF v_school_id IS NULL THEN
    RETURN public.unauthorized_api_response();
  END IF;

  -- 2. Resolve academic session
  IF p_academic_year_id IS NOT NULL AND TRIM(p_academic_year_id) != '' THEN
    BEGIN v_active_year_id := p_academic_year_id::UUID; EXCEPTION WHEN OTHERS THEN v_active_year_id := NULL; END;
  END IF;

  IF v_active_year_id IS NULL AND v_school_id IS NOT NULL THEN
    SELECT id INTO v_active_year_id
    FROM public.academic_years
    WHERE school_id = v_school_id AND is_current = TRUE AND deleted_at IS NULL
    LIMIT 1;

    IF v_active_year_id IS NULL THEN
      SELECT id INTO v_active_year_id
      FROM public.academic_years
      WHERE school_id = v_school_id AND deleted_at IS NULL
      ORDER BY created_at DESC LIMIT 1;
    END IF;
  END IF;

  -- 3. Calculate Fleet Metrics
  SELECT COUNT(*), COALESCE(SUM(seating_capacity), 0)
  INTO v_total_vehicles, v_total_capacity
  FROM public.transport_vehicles
  WHERE school_id = v_school_id AND status = 'ACTIVE' AND deleted_at IS NULL;

  SELECT COUNT(*) INTO v_active_routes
  FROM public.transport_routes
  WHERE school_id = v_school_id
    AND (v_active_year_id IS NULL OR academic_year_id = v_active_year_id)
    AND status = 'ACTIVE' AND deleted_at IS NULL;

  SELECT COUNT(*) INTO v_total_stops
  FROM public.transport_stops
  WHERE school_id = v_school_id AND status = 'ACTIVE' AND deleted_at IS NULL;

  SELECT COUNT(*) INTO v_active_passes
  FROM public.student_transport_assignments
  WHERE school_id = v_school_id
    AND (v_active_year_id IS NULL OR academic_year_id = v_active_year_id)
    AND status = 'ACTIVE' AND deleted_at IS NULL;

  IF v_total_capacity > 0 THEN
    v_occupancy_rate := ROUND((v_active_passes::NUMERIC / v_total_capacity::NUMERIC) * 100, 1);
  ELSE
    v_occupancy_rate := 0.00;
  END IF;

  -- 4. Vehicles Catalog
  SELECT COALESCE(jsonb_agg(veh_row), '[]'::JSONB)
  INTO v_vehicles_list
  FROM (
    SELECT
      id, vehicle_number, bus_number, vehicle_type, model,
      seating_capacity, driver_name, driver_phone, status
    FROM public.transport_vehicles
    WHERE school_id = v_school_id AND deleted_at IS NULL
    ORDER BY vehicle_number ASC
  ) veh_row;

  -- 5. Routes with Vehicle Details & Counts
  SELECT COALESCE(jsonb_agg(rt_row), '[]'::JSONB)
  INTO v_routes_list
  FROM (
    SELECT
      r.id,
      r.school_id,
      r.academic_year_id,
      r.name,
      r.code,
      r.vehicle_id,
      r.morning_start_time,
      r.evening_start_time,
      r.description,
      r.status,
      v.bus_number,
      v.driver_name,
      v.driver_phone,
      COALESCE((SELECT COUNT(*) FROM public.transport_stops ts WHERE ts.route_id = r.id AND ts.deleted_at IS NULL), 0) AS total_stops,
      COALESCE((SELECT COUNT(*) FROM public.student_transport_assignments sta WHERE sta.route_id = r.id AND sta.deleted_at IS NULL), 0) AS enrolled_students
    FROM public.transport_routes r
    LEFT JOIN public.transport_vehicles v ON v.id = r.vehicle_id
    WHERE r.school_id = v_school_id
      AND (v_active_year_id IS NULL OR r.academic_year_id = v_active_year_id)
      AND r.deleted_at IS NULL
    ORDER BY r.code ASC
  ) rt_row;

  -- 6. Stops Catalog
  SELECT COALESCE(jsonb_agg(st_row), '[]'::JSONB)
  INTO v_stops_list
  FROM (
    SELECT
      id, route_id, stop_name, pickup_time, drop_time,
      sequence_order, monthly_fare, landmark, status
    FROM public.transport_stops
    WHERE school_id = v_school_id AND deleted_at IS NULL
    ORDER BY sequence_order ASC
  ) st_row;

  -- 7. Student Transport Passes with Student, Class, Section & Guardian safely joined
  SELECT COALESCE(jsonb_agg(pass_row), '[]'::JSONB)
  INTO v_passes_list
  FROM (
    SELECT
      sta.id,
      sta.school_id,
      sta.academic_year_id,
      sta.student_id,
      sta.route_id,
      sta.stop_id,
      sta.pass_number,
      sta.seat_number,
      sta.emergency_contact,
      sta.status,
      sta.start_date,
      TRIM(CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))) AS student_name,
      COALESCE(s.admission_number, '') AS admission_number,
      COALESCE(s.photo_url, '') AS photo_url,
      COALESCE(c.name, 'Class') AS class_name,
      COALESCE(sec.name, 'Section A') AS section_name,
      COALESCE(r.name, 'Route') AS route_name,
      COALESCE(r.code, 'RT-01') AS route_code,
      COALESCE(v.bus_number, 'Bus') AS bus_number,
      COALESCE(ts.stop_name, 'Stop') AS stop_name,
      COALESCE(ts.pickup_time, '07:15 AM') AS pickup_time,
      COALESCE(ts.drop_time, '02:45 PM') AS drop_time,
      COALESCE(ts.monthly_fare, 1200.00) AS monthly_fare,
      COALESCE(g.guardian_name, 'Parent') AS guardian_name,
      COALESCE(g.guardian_phone, '') AS guardian_phone
    FROM public.student_transport_assignments sta
    JOIN public.students s ON s.id = sta.student_id
    LEFT JOIN LATERAL (
      SELECT se.class_id, se.section_id
      FROM public.student_enrollments se
      WHERE se.student_id = s.id
        AND (v_active_year_id IS NULL OR se.academic_year_id = v_active_year_id)
        AND se.status = 'ACTIVE'
      ORDER BY se.created_at DESC
      LIMIT 1
    ) enroll ON true
    LEFT JOIN public.classes c ON c.id = enroll.class_id
    LEFT JOIN public.sections sec ON sec.id = enroll.section_id
    LEFT JOIN public.transport_routes r ON r.id = sta.route_id
    LEFT JOIN public.transport_vehicles v ON v.id = r.vehicle_id
    LEFT JOIN public.transport_stops ts ON ts.id = sta.stop_id
    LEFT JOIN LATERAL (
      SELECT 
        TRIM(CONCAT(grd.first_name, ' ', COALESCE(grd.last_name, ''))) AS guardian_name,
        grd.phone AS guardian_phone
      FROM public.student_guardians sg
      JOIN public.guardians grd ON grd.id = sg.guardian_id
      WHERE sg.student_id = s.id
      LIMIT 1
    ) g ON true
    WHERE sta.school_id = v_school_id
      AND (v_active_year_id IS NULL OR sta.academic_year_id = v_active_year_id)
      AND sta.deleted_at IS NULL
    ORDER BY sta.created_at DESC
    LIMIT 200
  ) pass_row;

  -- 8. Classes list for dropdowns
  SELECT COALESCE(jsonb_agg(cls_row), '[]'::JSONB)
  INTO v_classes_list
  FROM (
    SELECT id, name, code, display_order
    FROM public.classes
    WHERE school_id = v_school_id AND deleted_at IS NULL
    ORDER BY display_order ASC, name ASC
  ) cls_row;

  v_result := jsonb_build_object(
    'success', true,
    'overview', jsonb_build_object(
      'totalVehicles', v_total_vehicles,
      'activeRoutes', v_active_routes,
      'totalStops', v_total_stops,
      'activePasses', v_active_passes,
      'totalCapacity', v_total_capacity,
      'occupancyRate', v_occupancy_rate
    ),
    'vehicles', v_vehicles_list,
    'routes', v_routes_list,
    'stops', v_stops_list,
    'passes', v_passes_list,
    'classes', v_classes_list
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_departmental_users_overview TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_fees_management_overview TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_transport_department_overview TO authenticated, anon, service_role;

-- Reload Supabase PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
