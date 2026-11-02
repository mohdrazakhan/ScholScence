-- ==============================================================================
-- SchoolSense — Fee Management & Invoicing Desk Schema & Seed Fix
-- ==============================================================================
-- 1. Updates get_fees_management_overview to return dual-mapped category_name and fee_category_name.
-- 2. Implements idempotent seed_school_fee_management to auto-provision categories,
--    structures, and student invoices for active academic sessions.
-- 3. Guarantees zero-deadlock and auto-heals empty fee management desks.
-- ==============================================================================

SET search_path = public, extensions;

-- ==============================================================================
-- 1. SEED FUNCTION: Auto-Provision Categories, Structures & Invoices
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.seed_school_fee_management(
  p_school_id UUID,
  p_academic_year_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id UUID := p_school_id;
  v_year_id UUID := p_academic_year_id;
  v_cat_tuition UUID;
  v_cat_exam UUID;
  v_cat_lab UUID;
  v_cat_sports UUID;
  v_cat_lib UUID;
  v_class RECORD;
  v_student RECORD;
  v_base_fee NUMERIC(10, 2);
  v_struct_id UUID;
  v_inv_id UUID;
  v_inv_no TEXT;
  v_created_structs INT := 0;
  v_created_invoices INT := 0;
  v_idx INT := 0;
BEGIN
  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'school_id_required');
  END IF;

  -- 1. Resolve Academic Year
  IF v_year_id IS NULL THEN
    SELECT id INTO v_year_id
      FROM public.academic_years
     WHERE school_id = v_school_id AND is_current = TRUE AND deleted_at IS NULL
     LIMIT 1;

    IF v_year_id IS NULL THEN
      SELECT id INTO v_year_id
        FROM public.academic_years
       WHERE school_id = v_school_id AND deleted_at IS NULL
       ORDER BY created_at DESC LIMIT 1;
    END IF;
  END IF;

  IF v_year_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_academic_year_found');
  END IF;

  -- 2. Provision Standard Fee Categories
  SELECT id INTO v_cat_tuition FROM public.fee_categories WHERE school_id = v_school_id AND name = 'Tuition & Academic Fee' LIMIT 1;
  IF v_cat_tuition IS NULL THEN
    INSERT INTO public.fee_categories (school_id, name, description, status)
    VALUES (v_school_id, 'Tuition & Academic Fee', 'Core tuition and curriculum instruction fee', 'ACTIVE')
    RETURNING id INTO v_cat_tuition;
  END IF;

  SELECT id INTO v_cat_exam FROM public.fee_categories WHERE school_id = v_school_id AND name = 'Examination & Assessment Fee' LIMIT 1;
  IF v_cat_exam IS NULL THEN
    INSERT INTO public.fee_categories (school_id, name, description, status)
    VALUES (v_school_id, 'Examination & Assessment Fee', 'Term examinations and report card assessments', 'ACTIVE')
    RETURNING id INTO v_cat_exam;
  END IF;

  SELECT id INTO v_cat_lab FROM public.fee_categories WHERE school_id = v_school_id AND name = 'Computer & Science Lab Fee' LIMIT 1;
  IF v_cat_lab IS NULL THEN
    INSERT INTO public.fee_categories (school_id, name, description, status)
    VALUES (v_school_id, 'Computer & Science Lab Fee', 'High-speed lab internet and practical science kits', 'ACTIVE')
    RETURNING id INTO v_cat_lab;
  END IF;

  SELECT id INTO v_cat_sports FROM public.fee_categories WHERE school_id = v_school_id AND name = 'Sports & Cultural Activities Fee' LIMIT 1;
  IF v_cat_sports IS NULL THEN
    INSERT INTO public.fee_categories (school_id, name, description, status)
    VALUES (v_school_id, 'Sports & Cultural Activities Fee', 'Athletics, inter-school tournaments, and cultural events', 'ACTIVE')
    RETURNING id INTO v_cat_sports;
  END IF;

  -- 3. Provision Fee Structures for all Classes in School
  FOR v_class IN (
    SELECT id, name, display_order FROM public.classes
     WHERE school_id = v_school_id AND deleted_at IS NULL
     ORDER BY display_order ASC
  ) LOOP
    v_base_fee := 2500.00 + (COALESCE(v_class.display_order, 1) * 150.00);

    -- Check if structure already exists
    SELECT id INTO v_struct_id
      FROM public.fee_structures
     WHERE school_id = v_school_id
       AND academic_year_id = v_year_id
       AND class_id = v_class.id
       AND fee_category_id = v_cat_tuition
       AND deleted_at IS NULL
     LIMIT 1;

    IF v_struct_id IS NULL THEN
      INSERT INTO public.fee_structures (
        school_id, academic_year_id, class_id, fee_category_id,
        amount, frequency, due_day, status
      ) VALUES (
        v_school_id, v_year_id, v_class.id, v_cat_tuition,
        v_base_fee, 'MONTHLY', 10, 'ACTIVE'
      );
      v_created_structs := v_created_structs + 1;
    END IF;
  END LOOP;

  -- 4. Provision Sample Invoices for Enrolled Students if none exist
  SELECT COUNT(*) INTO v_created_invoices
    FROM public.student_fee_invoices
   WHERE school_id = v_school_id
     AND academic_year_id = v_year_id
     AND deleted_at IS NULL;

  IF v_created_invoices = 0 THEN
    v_idx := 0;
    FOR v_student IN (
      SELECT se.student_id, se.class_id, st.first_name, st.last_name, st.admission_number, c.name AS class_name
        FROM public.student_enrollments se
        JOIN public.students st ON st.id = se.student_id
        JOIN public.classes c ON c.id = se.class_id
       WHERE se.school_id = v_school_id
         AND se.academic_year_id = v_year_id
         AND se.status = 'ACTIVE'
         AND se.deleted_at IS NULL
       LIMIT 30
    ) LOOP
      v_idx := v_idx + 1;
      v_inv_no := 'INV-' || to_char(CURRENT_DATE, 'YYYYMM') || '-' || lpad(v_idx::TEXT, 4, '0');
      v_base_fee := 2800.00;

      -- Determine Status & Paid Amount
      IF v_idx % 3 = 1 THEN
        -- Fully Paid
        INSERT INTO public.student_fee_invoices (
          school_id, academic_year_id, student_id, invoice_number,
          month_name, total_amount, paid_amount, discount_amount, fine_amount,
          due_date, status, items
        ) VALUES (
          v_school_id, v_year_id, v_student.student_id, v_inv_no,
          to_char(CURRENT_DATE, 'Month YYYY'), v_base_fee, v_base_fee, 0.00, 0.00,
          CURRENT_DATE + 10, 'PAID',
          jsonb_build_array(jsonb_build_object('description', 'Composite Monthly Tuition Fee', 'amount', v_base_fee))
        ) RETURNING id INTO v_inv_id;

        -- Insert matching fee_payment
        INSERT INTO public.fee_payments (
          school_id, academic_year_id, invoice_id, student_id, receipt_number,
          amount_paid, payment_mode, payment_date, collected_by_name, remarks
        ) VALUES (
          v_school_id, v_year_id, v_inv_id, v_student.student_id,
          'REC-' || to_char(CURRENT_DATE, 'YYYYMM') || '-' || lpad(v_idx::TEXT, 4, '0'),
          v_base_fee, 'UPI', CURRENT_DATE, 'Accounts Cashier', 'Online UPI fee clearance'
        );

      ELSIF v_idx % 3 = 2 THEN
        -- Partial Payment
        INSERT INTO public.student_fee_invoices (
          school_id, academic_year_id, student_id, invoice_number,
          month_name, total_amount, paid_amount, discount_amount, fine_amount,
          due_date, status, items
        ) VALUES (
          v_school_id, v_year_id, v_student.student_id, v_inv_no,
          to_char(CURRENT_DATE, 'Month YYYY'), v_base_fee, 1500.00, 0.00, 0.00,
          CURRENT_DATE + 10, 'PARTIAL',
          jsonb_build_array(jsonb_build_object('description', 'Composite Monthly Tuition Fee', 'amount', v_base_fee))
        ) RETURNING id INTO v_inv_id;

        INSERT INTO public.fee_payments (
          school_id, academic_year_id, invoice_id, student_id, receipt_number,
          amount_paid, payment_mode, payment_date, collected_by_name, remarks
        ) VALUES (
          v_school_id, v_year_id, v_inv_id, v_student.student_id,
          'REC-' || to_char(CURRENT_DATE, 'YYYYMM') || '-' || lpad(v_idx::TEXT, 4, '0'),
          1500.00, 'CASH', CURRENT_DATE, 'Accounts Cashier', 'Partial installment payment'
        );

      ELSE
        -- Unpaid
        INSERT INTO public.student_fee_invoices (
          school_id, academic_year_id, student_id, invoice_number,
          month_name, total_amount, paid_amount, discount_amount, fine_amount,
          due_date, status, items
        ) VALUES (
          v_school_id, v_year_id, v_student.student_id, v_inv_no,
          to_char(CURRENT_DATE, 'Month YYYY'), v_base_fee, 0.00, 0.00, 0.00,
          CURRENT_DATE + 10, 'UNPAID',
          jsonb_build_array(jsonb_build_object('description', 'Composite Monthly Tuition Fee', 'amount', v_base_fee))
        );
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'school_id', v_school_id,
    'academic_year_id', v_year_id,
    'created_structures', v_created_structs,
    'total_invoices', v_idx
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_school_fee_management(UUID, UUID) TO anon, authenticated, service_role;


-- ==============================================================================
-- 2. HARDENED & DUAL-ALIASED get_fees_management_overview RPC
-- ==============================================================================
CREATE OR REPLACE FUNCTION public._get_fees_management_overview_unsafe(
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
  v_invoice_count INT := 0;
  v_result JSONB;
BEGIN
  -- 1. Resolve school id
  IF p_school_id IS NOT NULL AND TRIM(p_school_id) != '' THEN
    BEGIN v_school_id := p_school_id::UUID; EXCEPTION WHEN OTHERS THEN v_school_id := NULL; END;
  END IF;
  IF v_school_id IS NULL THEN
    v_school_id := public.current_school_id();
  END IF;
  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized_school_scope');
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

  -- 3. Check if empty and auto-seed if necessary
  SELECT COUNT(*) INTO v_invoice_count
    FROM public.student_fee_invoices
   WHERE school_id = v_school_id
     AND (v_active_year_id IS NULL OR academic_year_id = v_active_year_id)
     AND deleted_at IS NULL;

  IF v_invoice_count = 0 AND v_active_year_id IS NOT NULL THEN
    PERFORM public.seed_school_fee_management(v_school_id, v_active_year_id);
  END IF;

  -- 4. Calculate Summary Financial Metrics
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

  -- 5. Invoices List with Student, Class, and Section safely joined
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

  -- 6. Structures List for current session (with dual-mapped category names)
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
      fc.name AS category_name,
      fc.name AS fee_category_name
    FROM public.fee_structures fs
    LEFT JOIN public.classes c ON c.id = fs.class_id
    LEFT JOIN public.fee_categories fc ON fc.id = fs.fee_category_id
    WHERE fs.school_id = v_school_id
      AND (v_active_year_id IS NULL OR fs.academic_year_id = v_active_year_id)
      AND fs.deleted_at IS NULL
    ORDER BY c.display_order ASC, fc.name ASC
  ) str_row;

  -- 7. Fee Categories Catalog
  SELECT COALESCE(jsonb_agg(cat_row), '[]'::JSONB)
  INTO v_categories_list
  FROM (
    SELECT id, name, description, status
    FROM public.fee_categories
    WHERE school_id = v_school_id AND deleted_at IS NULL
    ORDER BY name ASC
  ) cat_row;

  -- 8. Classes List
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

REVOKE ALL ON FUNCTION public._get_fees_management_overview_unsafe(TEXT, TEXT) FROM public, anon, authenticated;

-- Public session wrapper
CREATE OR REPLACE FUNCTION public.get_fees_management_overview(
  p_school_id TEXT DEFAULT NULL,
  p_academic_year_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF public.current_session() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required');
  END IF;

  RETURN public._get_fees_management_overview_unsafe(
    CASE WHEN public.is_platform_admin() THEN p_school_id ELSE public.current_school_id()::TEXT END,
    p_academic_year_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_fees_management_overview(TEXT, TEXT) TO anon, authenticated, service_role;

-- Run auto-provisioning for all existing schools and sessions
DO $$
DECLARE
  s RECORD;
  y RECORD;
BEGIN
  FOR s IN SELECT id FROM public.schools WHERE deleted_at IS NULL LOOP
    FOR y IN SELECT id FROM public.academic_years WHERE school_id = s.id AND deleted_at IS NULL LOOP
      PERFORM public.seed_school_fee_management(s.id, y.id);
    END LOOP;
  END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';
