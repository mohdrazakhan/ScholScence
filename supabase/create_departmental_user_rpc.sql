-- ====================================================================
-- SchoolSense — Robust Departmental User Creation RPC
-- ====================================================================
-- Ensures departmental roles exist in public.roles, resolves email conflicts,
-- and safely links users into user_school_roles.
-- ====================================================================

-- 1. Ensure departmental roles exist in public.roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE code = 'FEE_MANAGER') THEN
    INSERT INTO public.roles (name, code, description, is_system_role, status)
    VALUES ('Fee Manager', 'FEE_MANAGER', 'Fee & Accounts Department Manager', TRUE, 'ACTIVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE code = 'TRANSPORT_MANAGER') THEN
    INSERT INTO public.roles (name, code, description, is_system_role, status)
    VALUES ('Transport Manager', 'TRANSPORT_MANAGER', 'Fleet & Transport Department Supervisor', TRUE, 'ACTIVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE code = 'STAFF') THEN
    INSERT INTO public.roles (name, code, description, is_system_role, status)
    VALUES ('Staff', 'STAFF', 'Departmental Staff Member', TRUE, 'ACTIVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE code = 'LIBRARIAN') THEN
    INSERT INTO public.roles (name, code, description, is_system_role, status)
    VALUES ('Librarian', 'LIBRARIAN', 'Library & Resources Center Manager', TRUE, 'ACTIVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE code = 'SPORTS_DIRECTOR') THEN
    INSERT INTO public.roles (name, code, description, is_system_role, status)
    VALUES ('Sports Director', 'SPORTS_DIRECTOR', 'Physical Education & Sports In-Charge', TRUE, 'ACTIVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE code = 'RECEPTIONIST') THEN
    INSERT INTO public.roles (name, code, description, is_system_role, status)
    VALUES ('Receptionist', 'RECEPTIONIST', 'Front Desk & Admissions Desk Representative', TRUE, 'ACTIVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE code = 'SECURITY_STAFF') THEN
    INSERT INTO public.roles (name, code, description, is_system_role, status)
    VALUES ('Security Staff', 'SECURITY_STAFF', 'Campus Safety & Security Officer', TRUE, 'ACTIVE');
  END IF;
END $$;

-- 2. Core RPC implementation
CREATE OR REPLACE FUNCTION public._create_departmental_user_unsafe(
  p_school_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_role_code text,
  p_department text,
  p_designation text,
  p_password text,
  p_custom_permissions jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_role_id uuid;
  v_clean_email text := lower(trim(coalesce(p_email, '')));
  v_clean_first text := trim(coalesce(p_first_name, 'Staff'));
  v_clean_last text := trim(coalesce(p_last_name, ''));
  v_clean_phone text := trim(coalesce(p_phone, ''));
  v_clean_dept text := trim(coalesce(p_department, 'Administration'));
  v_clean_desig text := trim(coalesce(p_designation, 'Staff Member'));
  v_clean_role text := upper(trim(coalesce(p_role_code, 'STAFF')));
  v_perms jsonb := coalesce(p_custom_permissions, '["dashboard"]'::jsonb);
BEGIN
  IF v_clean_email = '' OR v_clean_email NOT LIKE '%@%' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valid email address is required.');
  END IF;

  -- 1. Find role_id dynamically
  SELECT id INTO v_role_id FROM public.roles WHERE code = v_clean_role LIMIT 1;
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM public.roles WHERE code = 'STAFF' LIMIT 1;
  END IF;
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM public.roles WHERE code = 'SCHOOL_ADMIN' LIMIT 1;
  END IF;
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM public.roles LIMIT 1;
  END IF;

  -- 2. Check if user already exists with this email
  SELECT id INTO v_user_id FROM public.users WHERE lower(email) = v_clean_email LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Update existing user profile
    UPDATE public.users
    SET 
      first_name = coalesce(nullif(v_clean_first, ''), first_name),
      last_name = v_clean_last,
      phone = coalesce(nullif(v_clean_phone, ''), phone),
      department = v_clean_dept,
      designation = v_clean_desig,
      custom_permissions = v_perms,
      status = 'ACTIVE',
      password_hash = CASE 
        WHEN p_password IS NOT NULL AND trim(p_password) <> '' THEN p_password 
        ELSE password_hash 
      END,
      updated_at = now()
    WHERE id = v_user_id;
  ELSE
    -- Insert new user
    v_user_id := gen_random_uuid();
    INSERT INTO public.users (
      id,
      email,
      phone,
      first_name,
      last_name,
      password_hash,
      status,
      department,
      designation,
      custom_permissions,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_clean_email,
      v_clean_phone,
      v_clean_first,
      v_clean_last,
      coalesce(nullif(trim(p_password), ''), 'School@123'),
      'ACTIVE',
      v_clean_dept,
      v_clean_desig,
      v_perms,
      now(),
      now()
    );
  END IF;

  -- 3. Upsert user_school_roles
  INSERT INTO public.user_school_roles (
    user_id,
    school_id,
    role_id,
    status,
    department,
    designation,
    custom_permissions,
    deleted_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_school_id,
    v_role_id,
    'ACTIVE',
    v_clean_dept,
    v_clean_desig,
    v_perms,
    null,
    now(),
    now()
  )
  ON CONFLICT (user_id, school_id, role_id) DO UPDATE
  SET 
    status = 'ACTIVE',
    department = excluded.department,
    designation = excluded.designation,
    custom_permissions = excluded.custom_permissions,
    deleted_at = null,
    updated_at = now();

  -- 4. Return success response
  RETURN jsonb_build_object(
    'success', true,
    'id', v_user_id,
    'school_id', p_school_id,
    'first_name', v_clean_first,
    'last_name', v_clean_last,
    'name', trim(concat(v_clean_first, ' ', v_clean_last)),
    'email', v_clean_email,
    'phone', v_clean_phone,
    'role', v_clean_role,
    'department', v_clean_dept,
    'designation', v_clean_desig,
    'status', 'ACTIVE',
    'custom_permissions', v_perms
  );
END;
$$;

-- 3. Secure caller-verified public wrapper
CREATE OR REPLACE FUNCTION public.create_departmental_user(
  p_school_id text DEFAULT null,
  p_first_name text DEFAULT null,
  p_last_name text DEFAULT null,
  p_email text DEFAULT null,
  p_phone text DEFAULT null,
  p_role_code text DEFAULT 'STAFF',
  p_department text DEFAULT 'Administration',
  p_designation text DEFAULT 'Staff Member',
  p_password text DEFAULT 'School@123',
  p_custom_permissions jsonb DEFAULT '["dashboard"]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id uuid;
BEGIN
  -- Verify caller has administrative / staff session
  IF NOT (public.is_platform_admin() OR public.is_staff_role()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied: Only administrators can create departmental accounts.');
  END IF;

  v_school_id := public.current_school_id();
  IF v_school_id IS NULL AND p_school_id IS NOT NULL THEN
    BEGIN
      v_school_id := p_school_id::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_school_id := NULL;
    END;
  END IF;

  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid school session.');
  END IF;

  RETURN public._create_departmental_user_unsafe(
    v_school_id,
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_role_code,
    p_department,
    p_designation,
    p_password,
    p_custom_permissions
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_departmental_user TO authenticated, anon, service_role;
REVOKE EXECUTE ON FUNCTION public._create_departmental_user_unsafe FROM public, anon, authenticated;
