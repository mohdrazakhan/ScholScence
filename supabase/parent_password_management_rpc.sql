-- ====================================================================
-- SchoolSense — Parent Portal Password Management RPC
-- ====================================================================
-- Allows School Administrators and Principals to set, update, or reset
-- the Parent Portal login password for any student's primary guardian.
-- Immediately updates public.users.password_hash with bcrypt so the parent
-- can log in immediately with the new credentials.
-- ====================================================================

-- 1. Unsafe internal implementation
CREATE OR REPLACE FUNCTION public._admin_set_parent_password_unsafe(
  p_school_id uuid,
  p_student_id uuid,
  p_new_password text,
  p_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_student record;
  v_user_id uuid := NULL;
  v_guardian_id uuid := NULL;
  v_role_id uuid := NULL;
  v_clean_pwd text;
  v_clean_email text;
BEGIN
  v_clean_pwd := trim(p_new_password);
  IF length(v_clean_pwd) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters long.';
  END IF;

  v_clean_email := lower(trim(coalesce(p_email, '')));

  -- 1. Verify student exists in this school
  SELECT id, first_name, last_name, admission_number, emergency_contact_name, emergency_contact_phone
    INTO v_student
    FROM public.students
   WHERE id = p_student_id
     AND school_id = p_school_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found in your school tenant.';
  END IF;

  -- 2. Find existing linked guardian and user
  SELECT g.id, g.user_id
    INTO v_guardian_id, v_user_id
    FROM public.student_guardians sg
    JOIN public.guardians g ON g.id = sg.guardian_id
   WHERE sg.student_id = p_student_id
     AND g.school_id = p_school_id
   LIMIT 1;

  -- 3. If not found via student_guardians, check by email if provided
  IF v_user_id IS NULL AND v_clean_email <> '' THEN
    SELECT u.id INTO v_user_id
      FROM public.users u
     WHERE lower(trim(u.email)) = v_clean_email
     LIMIT 1;
  END IF;

  -- 4. If user found, update password_hash and email
  IF v_user_id IS NOT NULL THEN
    UPDATE public.users
       SET password_hash = crypt(v_clean_pwd, gen_salt('bf', 10)),
           email = CASE WHEN v_clean_email <> '' THEN v_clean_email ELSE email END,
           updated_at = now()
     WHERE id = v_user_id;

    -- Fetch current email if it wasn't provided
    IF v_clean_email = '' THEN
      SELECT lower(trim(email)) INTO v_clean_email FROM public.users WHERE id = v_user_id;
    END IF;
  ELSE
    -- 5. If user does not exist, provision new parent user
    v_user_id := gen_random_uuid();
    IF v_clean_email = '' THEN
      v_clean_email := 'parent.' || replace(p_student_id::text, '-', '') || '@schoolsense.in';
    END IF;

    INSERT INTO public.users (
      id,
      email,
      phone,
      first_name,
      last_name,
      password_hash,
      status
    ) VALUES (
      v_user_id,
      v_clean_email,
      v_student.emergency_contact_phone,
      coalesce(v_student.emergency_contact_name, 'Parent'),
      v_student.last_name,
      crypt(v_clean_pwd, gen_salt('bf', 10)),
      'ACTIVE'
    );
  END IF;

  -- 6. Ensure GUARDIAN role exists
  SELECT id INTO v_role_id
    FROM public.roles
   WHERE code IN ('GUARDIAN', 'PARENT')
   LIMIT 1;

  IF v_role_id IS NULL THEN
    INSERT INTO public.roles (name, code, description, is_system_role, status)
    VALUES ('Guardian / Parent', 'GUARDIAN', 'Parent or Legal Guardian of Student', TRUE, 'ACTIVE')
    RETURNING id INTO v_role_id;
  END IF;

  -- 7. Ensure user_school_roles link
  INSERT INTO public.user_school_roles (user_id, school_id, role_id, status)
  VALUES (v_user_id, p_school_id, v_role_id, 'ACTIVE')
  ON CONFLICT (user_id, school_id, role_id) DO UPDATE SET status = 'ACTIVE';

  -- 8. Ensure guardians row exists
  IF v_guardian_id IS NULL THEN
    SELECT id INTO v_guardian_id
      FROM public.guardians
     WHERE school_id = p_school_id
       AND user_id = v_user_id
     LIMIT 1;

    IF v_guardian_id IS NULL THEN
      INSERT INTO public.guardians (school_id, user_id, relation, status)
      VALUES (p_school_id, v_user_id, 'Parent', 'ACTIVE')
      RETURNING id INTO v_guardian_id;
    END IF;
  END IF;

  -- 9. Ensure student_guardians link exists
  INSERT INTO public.student_guardians (student_id, guardian_id, relationship)
  VALUES (p_student_id, v_guardian_id, 'Parent')
  ON CONFLICT DO NOTHING;

  -- 10. Audit log
  BEGIN
    INSERT INTO public.audit_logs (
      school_id, user_id, action, entity, entity_id, details
    ) VALUES (
      p_school_id,
      public.current_user_id(),
      'SET_PARENT_PORTAL_PASSWORD',
      'users',
      v_user_id,
      jsonb_build_object(
        'student_id', p_student_id,
        'student_name', concat(v_student.first_name, ' ', v_student.last_name),
        'admission_number', v_student.admission_number,
        'email', v_clean_email,
        'changed_at', now()
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Continue if audit log schema differs
  END;

  RETURN jsonb_build_object(
    'success', TRUE,
    'user_id', v_user_id,
    'email', v_clean_email,
    'message', 'Parent login password updated successfully. The parent can now log into the portal immediately.'
  );
END;
$$;

-- 2. Secure public wrapper that resolves caller session
CREATE OR REPLACE FUNCTION public.admin_set_parent_password(
  p_student_id uuid,
  p_new_password text,
  p_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id uuid;
  v_role text;
BEGIN
  v_school_id := public.current_school_id();
  v_role := public.current_app_role();

  -- Verify authorization
  IF NOT (public.is_platform_admin() OR v_role IN ('SCHOOL_ADMIN', 'PRINCIPAL')) THEN
    RAISE EXCEPTION 'Access denied: Only School Administrators or Principals can manage parent credentials.';
  END IF;

  RETURN public._admin_set_parent_password_unsafe(v_school_id, p_student_id, p_new_password, p_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_parent_password(uuid, text, text) TO authenticated, anon;
REVOKE EXECUTE ON FUNCTION public._admin_set_parent_password_unsafe(uuid, uuid, text, text) FROM public, authenticated, anon;
