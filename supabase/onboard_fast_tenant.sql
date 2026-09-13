-- ==============================================================================
-- Clean & Lightweight School Onboarding Engine
-- Creates ONLY School + Academic Session + School Admin (Clean, Zero Dummy Data)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.onboard_school_tenant(
  p_name TEXT,
  p_code TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address_line1 TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_country TEXT DEFAULT 'India',
  p_postal_code TEXT DEFAULT NULL,
  p_admin_first_name TEXT DEFAULT 'School',
  p_admin_last_name TEXT DEFAULT 'Admin',
  p_admin_email TEXT DEFAULT NULL,
  p_admin_phone TEXT DEFAULT NULL,
  p_admin_password TEXT DEFAULT 'password123'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_school_id UUID;
  v_user_id UUID;
  v_role_id UUID;
  v_academic_year_id UUID;
  v_clean_code TEXT;
BEGIN
  -- 1. Validate School Code
  v_clean_code := UPPER(TRIM(p_code));
  IF v_clean_code IS NULL OR v_clean_code = '' THEN
    RAISE EXCEPTION 'School code is required.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.schools WHERE UPPER(code) = v_clean_code AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'A school with code "%" already exists. Please choose a different code.', v_clean_code;
  END IF;

  -- 2. Create Clean School Record
  INSERT INTO public.schools (
    name, code, email, phone, address_line1, city, state, country, postal_code, status
  ) VALUES (
    TRIM(p_name), v_clean_code, NULLIF(TRIM(p_email), ''), NULLIF(TRIM(p_phone), ''),
    NULLIF(TRIM(p_address_line1), ''), TRIM(p_city), NULLIF(TRIM(p_state), ''),
    COALESCE(NULLIF(TRIM(p_country), ''), 'India'), NULLIF(TRIM(p_postal_code), ''), 'ACTIVE'
  )
  RETURNING id INTO v_school_id;

  -- 3. Create Clean Academic Session
  INSERT INTO public.academic_years (
    school_id, name, start_date, end_date, is_current, status
  ) VALUES (
    v_school_id, '2026-2027', '2026-04-01'::DATE, '2027-03-31'::DATE, TRUE, 'ACTIVE'
  )
  RETURNING id INTO v_academic_year_id;

  -- 4. Create School Admin User (if email provided)
  IF p_admin_email IS NOT NULL AND TRIM(p_admin_email) != '' THEN
    SELECT id INTO v_user_id FROM public.users WHERE LOWER(email) = LOWER(TRIM(p_admin_email)) AND deleted_at IS NULL LIMIT 1;

    IF v_user_id IS NULL THEN
      INSERT INTO public.users (
        email, phone, first_name, last_name, password_hash, status
      ) VALUES (
        LOWER(TRIM(p_admin_email)), NULLIF(TRIM(p_admin_phone), ''),
        COALESCE(NULLIF(TRIM(p_admin_first_name), ''), 'School'),
        COALESCE(NULLIF(TRIM(p_admin_last_name), ''), 'Admin'),
        crypt(COALESCE(NULLIF(TRIM(p_admin_password), ''), 'password123'), gen_salt('bf', 10)),
        'ACTIVE'
      )
      RETURNING id INTO v_user_id;
    END IF;

    -- Ensure SCHOOL_ADMIN role exists
    SELECT id INTO v_role_id FROM public.roles WHERE code = 'SCHOOL_ADMIN' LIMIT 1;
    IF v_role_id IS NULL THEN
      INSERT INTO public.roles (name, code, description, is_system_role, status)
      VALUES ('School Admin', 'SCHOOL_ADMIN', 'School Principal or Institutional Administrator', TRUE, 'ACTIVE')
      RETURNING id INTO v_role_id;
    END IF;

    -- Assign School Admin Role
    INSERT INTO public.user_school_roles (user_id, school_id, role_id, status)
    VALUES (v_user_id, v_school_id, v_role_id, 'ACTIVE')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 5. Record Clean Audit Log
  INSERT INTO public.audit_logs (school_id, user_id, action, entity, new_values)
  VALUES (
    v_school_id,
    v_user_id,
    'ONBOARD_SCHOOL_SUCCESS',
    'schools',
    jsonb_build_object('code', v_clean_code, 'name', p_name, 'timestamp', NOW())
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'schoolId', v_school_id,
    'schoolCode', v_clean_code,
    'schoolName', p_name,
    'adminUserId', v_user_id,
    'adminEmail', p_admin_email,
    'message', 'School onboarded successfully with clean slate.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.onboard_school_tenant(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
