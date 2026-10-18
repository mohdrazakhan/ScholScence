-- ====================================================================
-- SchoolSense — Admin Reset User Password RPC
-- ====================================================================
-- Allows School Administrators and Principals to reset passwords for
-- users within their school tenant. Automatically crypts the password
-- with bcrypt so the user can immediately log in with the new password.
-- ====================================================================

CREATE OR REPLACE FUNCTION public._admin_reset_user_password_unsafe(
  p_school_id uuid,
  p_target_user_id uuid,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user record;
  v_trimmed text;
BEGIN
  v_trimmed := trim(p_new_password);
  IF length(v_trimmed) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters long.';
  END IF;

  -- 1. Verify user exists
  SELECT id, email, first_name, last_name INTO v_user
  FROM public.users
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  -- 2. Update password with bcrypt hash
  UPDATE public.users
  SET password_hash = crypt(v_trimmed, gen_salt('bf', 10)),
      updated_at = now()
  WHERE id = p_target_user_id;

  -- 3. Audit log
  BEGIN
    INSERT INTO public.audit_logs (
      school_id, user_id, action, entity, entity_id, details
    ) VALUES (
      p_school_id,
      public.current_user_id(),
      'RESET_USER_PASSWORD',
      'users',
      p_target_user_id,
      jsonb_build_object(
        'email', v_user.email,
        'user_name', concat(v_user.first_name, ' ', v_user.last_name),
        'reset_at', now()
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Continue if audit table schema differs
  END;

  RETURN jsonb_build_object(
    'success', TRUE,
    'user_id', p_target_user_id,
    'email', v_user.email,
    'message', 'Password reset successfully. The user can now login with the new password.'
  );
END;
$$;

-- 2. Secure public wrapper that resolves caller session
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  p_target_user_id uuid,
  p_new_password text
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
    RAISE EXCEPTION 'Access denied: Only School Administrators or Principals can reset staff passwords.';
  END IF;

  -- Verify target user belongs to the same school
  IF NOT public.is_platform_admin() THEN
    IF NOT public.shares_school_with(p_target_user_id) THEN
      RAISE EXCEPTION 'Access denied: Target user does not belong to your school.';
    END IF;
  END IF;

  RETURN public._admin_reset_user_password_unsafe(v_school_id, p_target_user_id, p_new_password);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(uuid, text) TO authenticated, anon;
REVOKE EXECUTE ON FUNCTION public._admin_reset_user_password_unsafe(uuid, uuid, text) FROM public, authenticated, anon;
