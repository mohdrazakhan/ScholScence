-- ==============================================================================
-- SchoolSense — Security Uniform Access Denial & Information Masking
-- ==============================================================================
-- Eliminates all technical leakage, hints, internal signature verification terms,
-- and varied error messages when unauthenticated, outside, or replayed requests occur.
-- Enforces a single, uniform 403 Forbidden denial across all endpoints:
-- "Access denied. This API can only be accessed through the official SchoolSense application."
-- ==============================================================================

SET search_path = public, extensions;

-- ==============================================================================
-- 1. UNIFORM 403 FORBIDDEN RESPONSE HELPER
-- ==============================================================================
DROP FUNCTION IF EXISTS public.unauthorized_api_response();

CREATE OR REPLACE FUNCTION public.unauthorized_api_response()
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM set_config('response.status', '403', true);
  RETURN jsonb_build_object(
    'message', 'Access denied. This API can only be accessed through the official SchoolSense application.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.unauthorized_api_response() FROM public, anon, authenticated;


-- ==============================================================================
-- 2. REVISED current_session() — UNIFORM ERROR MASKING
-- ==============================================================================
DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.current_session();
EXCEPTION WHEN dependent_objects_still_exist THEN
  -- Dependent RLS policies exist on current_session(); return type JSONB is identical so CREATE OR REPLACE FUNCTION proceeds in-place
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.current_session()
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_cached TEXT;
  v_token  TEXT;
  v_hash   TEXT;
  v_sess   RECORD;
  v_out    JSONB;
BEGIN
  -- Fast transaction-local cache so multi-row RLS evaluations only look up app_sessions once
  v_cached := current_setting('request.ss_session_v2', true);
  IF v_cached IS NOT NULL AND v_cached <> '' THEN
    IF v_cached = 'null' THEN
      RETURN NULL;
    END IF;
    RETURN v_cached::JSONB;
  END IF;

  IF NOT public.verify_request_signature(NULL, NULL, NULL) THEN
    PERFORM set_config('response.status', '403', true);
    RAISE EXCEPTION 'Access denied. This API can only be accessed through the official SchoolSense application.'
      USING errcode = '42501';
  END IF;

  v_token := COALESCE(current_setting('request.headers', true), '{}')::JSONB ->> 'x-schoolsense-token';
  IF v_token IS NULL OR LENGTH(v_token) < 20 THEN
    PERFORM set_config('request.ss_session_v2', 'null', true);
    RETURN NULL;
  END IF;

  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  SELECT s.id, s.user_id, s.school_id, s.role_code, s.is_support_session, s.signing_secret
    INTO v_sess
    FROM public.app_sessions s
   WHERE s.token_hash = v_hash
     AND s.revoked_at IS NULL
     AND s.expires_at > now()
   LIMIT 1;

  IF NOT FOUND THEN
    PERFORM set_config('request.ss_session_v2', 'null', true);
    RETURN NULL;
  END IF;

  IF NOT public.verify_request_signature(v_sess.id, v_sess.signing_secret, v_token) THEN
    PERFORM set_config('response.status', '403', true);
    RAISE EXCEPTION 'Access denied. This API can only be accessed through the official SchoolSense application.'
      USING errcode = '42501';
  END IF;

  v_out := jsonb_build_object(
    'session_id',     v_sess.id,
    'user_id',        v_sess.user_id,
    'school_id',      v_sess.school_id,
    'role',           v_sess.role_code,
    'is_support',     v_sess.is_support_session,
    'signing_secret', v_sess.signing_secret
  );
  PERFORM set_config('request.ss_session_v2', v_out::TEXT, true);
  RETURN v_out;
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_session() TO anon, authenticated;


-- ==============================================================================
-- 3. REVISED check_api_request_security() — POSTGREST GATEWAY HOOK
-- ==============================================================================
DROP FUNCTION IF EXISTS public.check_api_request_security();

CREATE OR REPLACE FUNCTION public.check_api_request_security()
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_req_method TEXT;
  v_req_path   TEXT;
BEGIN
  v_req_method := UPPER(COALESCE(current_setting('request.method', true), ''));
  v_req_path   := regexp_replace(COALESCE(current_setting('request.path', true), ''), '^/rest/v1', '');

  -- Allow CORS preflight OPTIONS requests
  IF v_req_method = 'OPTIONS' THEN
    RETURN;
  END IF;

  -- Block any SQL injection payload in URL path immediately with uniform message
  IF public.is_sql_injection_attempt(v_req_path) THEN
    PERFORM set_config('response.status', '403', true);
    RAISE EXCEPTION 'Access denied. This API can only be accessed through the official SchoolSense application.'
      USING errcode = '42501';
  END IF;

  -- Enforce signature + single-use nonce at the PostgREST gateway for ALL endpoints (both /table and /rpc/*)
  IF NOT public.verify_request_signature(NULL, NULL, NULL) THEN
    PERFORM set_config('response.status', '403', true);
    RAISE EXCEPTION 'Access denied. This API can only be accessed through the official SchoolSense application.'
      USING errcode = '42501';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_api_request_security() TO anon, authenticated, service_role;


-- ==============================================================================
-- 4. REVISED search_schools() — SECURE ANONYMOUS RPC WITH UNIFORM MASKING
-- ==============================================================================
-- Must drop explicitly prior to definition because changes in table return types (OUT params) cause PostgreSQL 42P13
DROP FUNCTION IF EXISTS public.search_schools(TEXT);

CREATE OR REPLACE FUNCTION public.search_schools(p_query TEXT)
RETURNS TABLE (
  id UUID,
  name VARCHAR(200),
  code VARCHAR(50),
  city VARCHAR(100),
  state VARCHAR(100)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_cleaned TEXT;
BEGIN
  IF NOT public.verify_request_signature(NULL, NULL, NULL) OR public.is_sql_injection_attempt(p_query) THEN
    PERFORM set_config('response.status', '403', true);
    RAISE EXCEPTION 'Access denied. This API can only be accessed through the official SchoolSense application.'
      USING errcode = '42501';
  END IF;

  -- Strip SQL wildcards (%, _, \) and quotes/semicolons
  v_cleaned := btrim(regexp_replace(COALESCE(p_query, ''), '[%_\\''";`]', '', 'g'));
  IF LENGTH(v_cleaned) < 3 OR LENGTH(v_cleaned) > 80 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT s.id, s.name, s.code, s.city, s.state
    FROM public.schools s
   WHERE s.deleted_at IS NULL
     AND s.status = 'ACTIVE'
     AND upper(s.code) <> 'PLATFORM'
     AND (
       s.name ILIKE ('%' || v_cleaned || '%')
       OR s.code ILIKE ('%' || v_cleaned || '%')
       OR s.city ILIKE ('%' || v_cleaned || '%')
     )
   ORDER BY s.name ASC
   LIMIT 20;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_schools(TEXT) TO anon, authenticated, service_role;


-- ==============================================================================
-- 5. REVISED authenticate_user() — UNIFORM REJECTION ON TAMPERED/UNSIGNED ACCESS
-- ==============================================================================
DROP FUNCTION IF EXISTS public.authenticate_user(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.authenticate_user(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.authenticate_user(
  p_identifier TEXT,
  p_password TEXT,
  p_school_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school RECORD;
  v_user RECORD;
  v_is_super BOOLEAN := FALSE;
  v_is_valid_password BOOLEAN := FALSE;
  v_target_school_id UUID := NULL;
  v_session_token TEXT;
  v_full_token TEXT;
  v_signing_secret TEXT;
  v_platform_school_id UUID;
  v_user_agent TEXT;
BEGIN
  -- 0. Enforce Anti-Postman / Request Signature & SQLi Verification on Login
  IF NOT public.verify_request_signature(NULL, NULL, NULL)
     OR public.is_sql_injection_attempt(p_identifier)
     OR public.is_sql_injection_attempt(p_school_code) THEN
    RETURN public.unauthorized_api_response();
  END IF;

  -- 1. Input Validation
  IF p_identifier IS NULL OR TRIM(p_identifier) = '' OR p_password IS NULL OR TRIM(p_password) = '' THEN
    RAISE EXCEPTION 'Identifier and password are required.';
  END IF;

  -- 1b. Pre-resolve Target School when logging into an individual school portal
  IF p_school_code IS NOT NULL AND TRIM(p_school_code) <> '' AND UPPER(TRIM(p_school_code)) <> 'PLATFORM' THEN
    SELECT * INTO v_school
      FROM public.schools
     WHERE upper(code) = upper(trim(p_school_code))
       AND status = 'ACTIVE'
       AND deleted_at IS NULL
     LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'The selected school is currently inactive or not found.';
    END IF;

    v_target_school_id := v_school.id;
  END IF;

  -- 2. Lookup User by Email or Phone
  SELECT * INTO v_user
    FROM public.users u
   WHERE (lower(u.email) = lower(trim(p_identifier)) OR u.phone = trim(p_identifier))
     AND u.status = 'ACTIVE'
     AND u.deleted_at IS NULL
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid email/phone or password.';
  END IF;

  -- 3. Password Verification (bcrypt)
  IF v_user.password_hash IS NOT NULL AND v_user.password_hash ~ '^\$2[abyx]\$[0-9]{2}\$' THEN
    v_is_valid_password := (v_user.password_hash = crypt(p_password, v_user.password_hash));
  ELSIF v_user.password_hash IS NOT NULL AND v_user.password_hash = p_password THEN
    -- Auto-upgrade legacy plaintext on valid match
    UPDATE public.users
       SET password_hash = crypt(p_password, gen_salt('bf', 10)),
           updated_at = now()
     WHERE id = v_user.id;
    v_is_valid_password := TRUE;
  ELSE
    v_is_valid_password := FALSE;
  END IF;

  IF NOT v_is_valid_password THEN
    RAISE EXCEPTION 'Invalid email/phone or password.';
  END IF;

  -- 4. Check if user is Super / Platform Administrator
  SELECT EXISTS (
    SELECT 1 FROM public.user_school_roles usr
    JOIN public.roles r ON r.id = usr.role_id
    WHERE usr.user_id = v_user.id
      AND usr.status = 'ACTIVE'
      AND usr.deleted_at IS NULL
      AND r.code IN ('SUPER_ADMIN', 'PLATFORM_ADMIN')
  ) INTO v_is_super;

  -- 5. Scope Resolution
  IF upper(coalesce(trim(p_school_code), '')) = 'PLATFORM' THEN
    IF NOT v_is_super THEN
      RAISE EXCEPTION 'Access denied. The Developer Console is strictly restricted to Platform Administrators.';
    END IF;

    SELECT id INTO v_platform_school_id
      FROM public.schools
     WHERE upper(code) = 'PLATFORM'
     LIMIT 1;

    v_target_school_id := v_platform_school_id;
  ELSE
    IF v_target_school_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.user_school_roles usr
         WHERE usr.user_id = v_user.id
           AND usr.school_id = v_target_school_id
           AND usr.status = 'ACTIVE'
           AND usr.deleted_at IS NULL
      ) AND NOT v_is_super THEN
        RAISE EXCEPTION 'This account is not registered with this school.';
      END IF;
    ELSE
      SELECT usr.school_id INTO v_target_school_id
        FROM public.user_school_roles usr
        JOIN public.schools s ON s.id = usr.school_id
       WHERE usr.user_id = v_user.id
         AND usr.status = 'ACTIVE'
         AND usr.deleted_at IS NULL
         AND s.status = 'ACTIVE'
         AND s.deleted_at IS NULL
       ORDER BY usr.created_at ASC
       LIMIT 1;
    END IF;
  END IF;

  -- 6. Generate Opaque Session Token & Signing Secret
  v_full_token := 'sec_' || encode(gen_random_bytes(32), 'hex');
  v_session_token := encode(digest(v_full_token, 'sha256'), 'hex');
  v_signing_secret := 'sig_' || encode(gen_random_bytes(32), 'hex');

  v_user_agent := coalesce(
    current_setting('request.headers', true)::jsonb ->> 'user-agent',
    'SchoolSense Client'
  );

  INSERT INTO public.app_sessions (
    token_hash,
    signing_secret,
    user_id,
    school_id,
    role_code,
    is_support_session,
    expires_at,
    user_agent
  ) VALUES (
    v_session_token,
    v_signing_secret,
    v_user.id,
    v_target_school_id,
    CASE WHEN v_is_super AND upper(coalesce(trim(p_school_code), '')) = 'PLATFORM' THEN 'PLATFORM_ADMIN' ELSE 'SCHOOL_ADMIN' END,
    FALSE,
    now() + INTERVAL '30 days',
    v_user_agent
  );

  RETURN jsonb_build_object(
    'token', v_full_token,
    'signing_secret', v_signing_secret,
    'user', jsonb_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'phone', v_user.phone,
      'firstName', v_user.first_name,
      'lastName', v_user.last_name
    ),
    'school_id', v_target_school_id,
    'is_platform_admin', v_is_super
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.authenticate_user(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
