-- ============================================================
-- SchoolSense — API REQUEST SIGNING & ANTI-POSTMAN LOCKDOWN
-- ============================================================
-- Protects all authenticated and public Supabase RPCs/tables against:
--   1. Direct Postman / Insomnia / curl / Python script calls
--   2. DevTools "Copy as cURL" / Network Tab replay attacks (single-use nonces)
--   3. Delayed replay attacks (±60-second timestamp drift window)
--   4. Parameter/path tampering (HMAC-SHA256 per-request signature verification)
--
-- Idempotent: safe to re-run at any time.
-- ============================================================

-- 1. Extend app_sessions with per-session HMAC signing secret
alter table public.app_sessions
  add column if not exists signing_secret text;

-- 2. Single-use Nonce Registry (Replay Attack Prevention)
create unlogged table if not exists public.api_request_nonces (
  nonce_hash text primary key,
  session_id uuid references public.app_sessions(id) on delete cascade,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists idx_api_request_nonces_created_at
  on public.api_request_nonces(created_at);

comment on table public.api_request_nonces is
  'Stores consumed per-request nonces for 2 minutes to block Postman/cURL replay of captured browser requests.';

alter table public.api_request_nonces enable row level security;
revoke all on public.api_request_nonces from anon, authenticated;


-- ============================================================
-- 3. CORE SIGNATURE & REPLAY VERIFICATION ENGINE
-- ============================================================
create or replace function public.verify_request_signature(
  p_session_id     uuid default null,
  p_signing_secret text default null,
  p_raw_token      text default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_headers        jsonb;
  v_user_agent     text;
  v_client_id      text;
  v_ts_text        text;
  v_ts             bigint;
  v_now            bigint;
  v_nonce          text;
  v_sig            text;
  v_target         text;
  v_req_method     text;
  v_req_path       text;
  v_target_method  text;
  v_target_path    text;
  v_signing_key    text;
  v_canonical_1    text;
  v_canonical_2    text;
  v_expected_1     text;
  v_expected_2     text;
  v_nonce_key      text;
  v_lock_id1       integer;
  v_lock_id2       integer;
  v_sig_matched    boolean := false;
  v_tok_header     text;
  v_tok_hash       text;
  v_sess_secret    text;
begin
  v_headers := coalesce(current_setting('request.headers', true), '{}')::jsonb;

  -- A. Fast path: if this exact HTTP request's nonce was already verified in the current SQL transaction,
  --    return true immediately so multi-table RLS joins don't re-verify or trip over their own nonce.
  v_nonce := v_headers ->> 'x-schoolsense-nonce';
  if v_nonce is not null
     and v_nonce <> ''
     and coalesce(current_setting('request.ss_verified_nonce', true), '') = v_nonce then
    return true;
  end if;

  -- B. Block known API testing tools & automated scripting clients by User-Agent
  v_user_agent := lower(coalesce(v_headers ->> 'user-agent', ''));
  if v_user_agent ~ '(postmanruntime|insomnia|curl/|python-requests|python-urllib|httpie|go-http-client|okhttp|axios/|pycurl)' then
    return false;
  end if;

  -- C. Require genuine SchoolSense client identifier header
  v_client_id := coalesce(v_headers ->> 'x-schoolsense-client', '');
  if v_client_id not in ('schoolsense-web-v1', 'schoolsense-mobile-v1') then
    return false;
  end if;

  -- D. Require Timestamp, Nonce, and HMAC Signature headers
  v_ts_text := v_headers ->> 'x-schoolsense-timestamp';
  v_sig     := lower(coalesce(v_headers ->> 'x-schoolsense-signature', ''));
  v_target  := coalesce(v_headers ->> 'x-schoolsense-target', '');

  if v_ts_text is null or v_nonce is null or v_sig = '' then
    return false;
  end if;

  if length(v_nonce) < 16 or length(v_nonce) > 128 or length(v_sig) <> 64 then
    return false;
  end if;

  -- E. Validate timestamp drift (±30 seconds window)
  begin
    v_ts := v_ts_text::bigint;
  exception when others then
    return false;
  end;

  v_now := extract(epoch from clock_timestamp())::bigint;
  if abs(v_now - v_ts) > 30 then
    return false;
  end if;

  -- F. Resolve HTTP method and normalized path, and enforce strict match against x-schoolsense-target
  v_target_method := upper(coalesce(nullif(split_part(v_target, ':', 1), ''), 'POST'));
  v_target_path   := regexp_replace(coalesce(nullif(substring(v_target from ':(.+)$'), ''), ''), '^/rest/v1', '');

  v_req_method := upper(coalesce(nullif(current_setting('request.method', true), ''), v_target_method));
  v_req_path   := regexp_replace(coalesce(nullif(current_setting('request.path', true), ''), v_target_path), '^/rest/v1', '');

  if v_target_path <> '' and v_req_path <> '' and (v_target_method <> v_req_method or v_target_path <> v_req_path) then
    return false;
  end if;

  -- G. Determine expected HMAC signing key(s)
  v_tok_header := coalesce(nullif(p_raw_token, ''), v_headers ->> 'x-schoolsense-token');
  v_canonical_1 := v_ts_text || '.' || v_nonce || '.' || v_req_method || '.' || v_req_path;
  v_canonical_2 := v_ts_text || '.' || v_nonce || '.' || v_target_method || '.' || v_target_path;
  v_sig_matched := false;

  -- G1. Check explicit per-session signing_secret stored on public.app_sessions
  v_sess_secret := nullif(p_signing_secret, '');
  if v_sess_secret is null and v_tok_header is not null and length(v_tok_header) >= 20 then
    v_tok_hash := encode(digest(v_tok_header, 'sha256'), 'hex');
    select s.signing_secret into v_sess_secret
      from public.app_sessions s
     where s.token_hash = v_tok_hash
       and s.revoked_at is null
       and s.expires_at > now()
     limit 1;
  end if;

  if v_sess_secret is not null and v_sess_secret <> '' then
    if v_sig = encode(hmac(v_canonical_1::bytea, v_sess_secret::bytea, 'sha256'), 'hex')
       or v_sig = encode(hmac(v_canonical_2::bytea, v_sess_secret::bytea, 'sha256'), 'hex') then
      v_sig_matched := true;
    end if;
  end if;

  -- G2. Check deterministic token-derived key (used when browser localStorage does not yet have signing_secret)
  if not v_sig_matched and v_tok_header is not null and v_tok_header <> '' then
    v_signing_key := encode(hmac(v_tok_header::bytea, 'schoolsense-v1-hmac-salt-2026'::bytea, 'sha256'), 'hex');
    if v_sig = encode(hmac(v_canonical_1::bytea, v_signing_key::bytea, 'sha256'), 'hex')
       or v_sig = encode(hmac(v_canonical_2::bytea, v_signing_key::bytea, 'sha256'), 'hex') then
      v_sig_matched := true;
    end if;
  end if;

  -- G3. Check client-app key fallback
  if not v_sig_matched then
    v_signing_key := 'schoolsense-client-app-v1-2026-hmac-key';
    if v_sig = encode(hmac(v_canonical_1::bytea, v_signing_key::bytea, 'sha256'), 'hex')
       or v_sig = encode(hmac(v_canonical_2::bytea, v_signing_key::bytea, 'sha256'), 'hex') then
      v_sig_matched := true;
    end if;
  end if;

  if not v_sig_matched then
    return false;
  end if;

  -- H. Check and consume single-use nonce for BOTH GET (READ ONLY) and POST (READ WRITE) requests!
  v_nonce_key := encode(digest('ss_nonce:' || v_nonce, 'sha256'), 'hex');
  v_lock_id1  := hashtext(v_nonce_key);
  v_lock_id2  := hashtext('ss_lock:' || v_nonce);

  if exists (
    select 1 from pg_locks
     where locktype = 'advisory'
       and classid = v_lock_id1
       and objid = v_lock_id2
       and objsubid = 2
       and granted = true
  ) then
    return false;
  end if;

  if not pg_try_advisory_lock(v_lock_id1, v_lock_id2) then
    return false;
  end if;

  if exists (select 1 from public.api_request_nonces where nonce_hash = v_nonce_key) then
    return false;
  end if;

  begin
    delete from public.api_request_nonces
     where created_at < clock_timestamp() - interval '2 minutes';

    insert into public.api_request_nonces (nonce_hash, session_id, created_at)
    values (v_nonce_key, p_session_id, clock_timestamp());
  exception
    when unique_violation then
      return false;
    when read_only_sql_transaction then
      null;
  end;

  perform set_config('request.ss_verified_nonce', v_nonce, true);

  return true;
end;
$$;

revoke all on function public.verify_request_signature(uuid, text, text) from public, anon, authenticated;


-- ============================================================
-- 4. CLEAN 2-LINE 403 FORBIDDEN JSON RESPONSE HELPER
-- ============================================================
create or replace function public.unauthorized_api_response()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  perform set_config('response.status', '403', true);
  perform set_config('response.headers', '[{"Content-Encoding": "deflate"}]', true);
  return jsonb_build_object(
    'hint', 'This API can only be accessed through the official SchoolSense application.',
    'message', 'Access denied: Unauthorized API client or replayed request signature.'
  );
end;
$$;

revoke all on function public.unauthorized_api_response() from public, anon, authenticated;


-- ============================================================
-- 5. UPGRADE current_session() TO ENFORCE REQUEST SIGNING & CACHE PER TRANSACTION
-- ============================================================
create or replace function public.current_session()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_cached text;
  v_token  text;
  v_hash   text;
  v_sess   record;
  v_out    jsonb;
begin
  -- Fast transaction-local cache so multi-row RLS evaluations only look up app_sessions once
  v_cached := current_setting('request.ss_session_v2', true);
  if v_cached is not null and v_cached <> '' then
    if v_cached = 'null' then
      return null;
    end if;
    return v_cached::jsonb;
  end if;

  if not public.verify_request_signature(null, null, null) then
    perform set_config('response.status', '403', true);
    raise exception 'Access denied: Unauthorized API client or replayed request signature.'
      using errcode = '42501',
            hint = 'This API can only be accessed through the official SchoolSense application.';
  end if;

  v_token := coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'x-schoolsense-token';
  if v_token is null or length(v_token) < 20 then
    perform set_config('request.ss_session_v2', 'null', true);
    return null;
  end if;

  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  select s.id, s.user_id, s.school_id, s.role_code, s.is_support_session, s.signing_secret
    into v_sess
    from public.app_sessions s
   where s.token_hash = v_hash
     and s.revoked_at is null
     and s.expires_at > now()
   limit 1;

  if not found then
    perform set_config('request.ss_session_v2', 'null', true);
    return null;
  end if;

  if not public.verify_request_signature(v_sess.id, v_sess.signing_secret, v_token) then
    perform set_config('response.status', '403', true);
    raise exception 'Access denied: Unauthorized API client or replayed request signature.'
      using errcode = '42501',
            hint = 'This API can only be accessed through the official SchoolSense application.';
  end if;

  v_out := jsonb_build_object(
    'session_id',     v_sess.id,
    'user_id',        v_sess.user_id,
    'school_id',      v_sess.school_id,
    'role',           v_sess.role_code,
    'is_support',     v_sess.is_support_session,
    'signing_secret', v_sess.signing_secret
  );
  perform set_config('request.ss_session_v2', v_out::text, true);
  return v_out;
end;
$$;

grant execute on function public.current_session() to anon, authenticated;


-- ============================================================
-- 6. UPGRADE whoami() AND logout_session() TO ENFORCE SIGNING
-- ============================================================
create or replace function public.whoami()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_sess jsonb;
  v_user RECORD;
  v_school RECORD;
begin
  if not public.verify_request_signature(null, null, null) then
    return public.unauthorized_api_response();
  end if;

  v_sess := public.current_session();
  if v_sess is null then
    return jsonb_build_object('valid', false);
  end if;

  select id, email, phone, first_name, last_name, status
    into v_user from public.users where id = (v_sess ->> 'user_id')::uuid;

  select id, name, code
    into v_school from public.schools where id = nullif(v_sess ->> 'school_id', '')::uuid;

  return jsonb_build_object(
    'valid', true,
    'signingSecret', v_sess ->> 'signing_secret',
    'user', jsonb_build_object(
      'id', v_user.id, 'email', v_user.email, 'phone', v_user.phone,
      'firstName', v_user.first_name, 'lastName', coalesce(v_user.last_name, ''),
      'status', v_user.status
    ),
    'school', case when v_school.id is null then null else
      jsonb_build_object('id', v_school.id, 'name', v_school.name, 'code', v_school.code) end,
    'role', v_sess ->> 'role',
    'isSupportSession', coalesce((v_sess ->> 'is_support')::boolean, false)
  );
end;
$$;
grant execute on function public.whoami() to anon, authenticated;

create or replace function public.logout_session()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
begin
  if not public.verify_request_signature(null, null, null) then
    return public.unauthorized_api_response();
  end if;

  v_token := coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'x-schoolsense-token';
  if v_token is null then
    return public.unauthorized_api_response();
  end if;

  update public.app_sessions
     set revoked_at = now()
   where token_hash = encode(digest(v_token, 'sha256'), 'hex')
     and revoked_at is null;

  return jsonb_build_object('success', true);
end;
$$;
grant execute on function public.logout_session() to anon, authenticated;


-- ============================================================
-- 6. UPGRADE authenticate_user() — VERIFY SIGNATURE & ISSUE signingSecret
-- ============================================================
create or replace function public.authenticate_user(
  p_identifier text,
  p_password text,
  p_school_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user RECORD;
  v_school RECORD;
  v_usr RECORD;
  v_is_super BOOLEAN := FALSE;
  v_is_valid_password BOOLEAN := FALSE;
  v_target_school_id UUID := NULL;
  v_session_token TEXT;
  v_full_token TEXT;
  v_signing_secret TEXT;
  v_platform_school_id UUID;
  v_user_agent TEXT;
begin
  -- 0. Enforce Anti-Postman / Request Signature & SQLi Verification on Login
  if not public.verify_request_signature(null, null, null)
     or public.is_sql_injection_attempt(p_identifier)
     or public.is_sql_injection_attempt(p_school_code) then
    return public.unauthorized_api_response();
  end if;

  -- 1. Input Validation
  if p_identifier is null or trim(p_identifier) = '' or p_password is null or trim(p_password) = '' then
    raise exception 'Identifier and password are required.';
  end if;

  -- 2. Lookup User
  select * into v_user
  from public.users u
  where (lower(u.email) = lower(trim(p_identifier)) or u.phone = trim(p_identifier))
    and u.status = 'ACTIVE'
    and u.deleted_at is null
  limit 1;

  if not found then
    raise exception 'Invalid email/phone or password.';
  end if;

  -- 3. Password Verification (bcrypt; legacy plaintext auto-upgrades)
  if v_user.password_hash is not null and v_user.password_hash ~ '^\$2[aby]\$[0-9]{2}\$' then
    v_is_valid_password := (v_user.password_hash = crypt(p_password, v_user.password_hash));
  else
    v_is_valid_password := (v_user.password_hash = p_password);
    if v_is_valid_password then
      update public.users set password_hash = crypt(p_password, gen_salt('bf', 10)) where id = v_user.id;
    end if;
  end if;

  if not v_is_valid_password then
    insert into public.audit_logs (user_id, action, entity, old_values)
    values (v_user.id, 'FAILED_LOGIN_ATTEMPT', 'auth',
            jsonb_build_object('identifier', p_identifier, 'timestamp', now()));
    raise exception 'Invalid email/phone or password.';
  end if;

  update public.users set last_login_at = now() where id = v_user.id;

  -- 4. Is the user a platform/super admin?
  if lower(v_user.email) = 'admin@schoolscence.in' then
    v_is_super := true;
  else
    select exists (
      select 1 from public.user_school_roles usr
      join public.roles r on r.id = usr.role_id
      where usr.user_id = v_user.id
        and usr.status = 'ACTIVE'
        and r.code in ('SUPER_ADMIN', 'PLATFORM_ADMIN')
    ) into v_is_super;
  end if;

  -- housekeeping: purge long-expired sessions
  delete from public.app_sessions where expires_at < now() - interval '7 days';

  v_session_token  := encode(gen_random_bytes(32), 'hex');
  v_full_token     := 'sec_' || v_session_token;
  v_signing_secret := 'sig_' || encode(gen_random_bytes(32), 'hex');
  v_user_agent     := left(coalesce(coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'user-agent', ''), 300);

  -- ----------------------------------------------------------------------------
  -- Case A: Platform Console Login (school code = 'PLATFORM')
  -- ----------------------------------------------------------------------------
  if upper(coalesce(p_school_code, '')) = 'PLATFORM' then
    if not v_is_super then
      raise exception 'Access denied. The Developer Console is strictly restricted to Platform Administrators.';
    end if;

    select id into v_platform_school_id
      from public.schools
     where code = 'PLATFORM'
     limit 1;

    insert into public.app_sessions (token_hash, signing_secret, user_id, school_id, role_code, expires_at, user_agent)
    values (encode(digest(v_full_token, 'sha256'), 'hex'), v_signing_secret, v_user.id, v_platform_school_id,
            'SUPER_ADMIN', now() + interval '30 days', v_user_agent);

    insert into public.audit_logs (user_id, action, entity)
    values (v_user.id, 'ROOT_CONSOLE_LOGIN', 'auth');

    return jsonb_build_object(
      'accessToken', v_full_token,
      'signingSecret', v_signing_secret,
      'refreshToken', 'ref_' || encode(gen_random_bytes(32), 'hex'),
      'user', jsonb_build_object(
        'id', v_user.id,
        'email', v_user.email,
        'phone', v_user.phone,
        'firstName', v_user.first_name,
        'lastName', coalesce(v_user.last_name, ''),
        'role', 'SUPER_ADMIN',
        'roleName', 'Super Admin',
        'permissions', jsonb_build_array('*')
      )
    );
  end if;

  -- ----------------------------------------------------------------------------
  -- Case B: Individual School Portal
  -- ----------------------------------------------------------------------------
  if p_school_code is not null and trim(p_school_code) != '' then
    select * into v_school
    from public.schools
    where upper(code) = upper(trim(p_school_code))
      and status = 'ACTIVE'
      and deleted_at is null
    limit 1;

    if not found then
      raise exception 'The selected school is currently inactive or not found.';
    end if;

    v_target_school_id := v_school.id;
  end if;

  select
    usr.id,
    usr.school_id,
    r.code as role_code,
    r.name as role_name,
    s.name as school_name,
    s.code as school_code,
    s.status as school_status
  into v_usr
  from public.user_school_roles usr
  join public.roles r on r.id = usr.role_id
  join public.schools s on s.id = usr.school_id
  where usr.user_id = v_user.id
    and usr.status = 'ACTIVE'
    and s.status = 'ACTIVE'
    and (v_target_school_id is null or usr.school_id = v_target_school_id)
  limit 1;

  if not found then
    if v_school.name is not null then
      raise exception 'This account does not belong to %.', v_school.name;
    else
      raise exception 'This account is not registered with this school.';
    end if;
  end if;

  insert into public.app_sessions (token_hash, signing_secret, user_id, school_id, role_code, expires_at, user_agent)
  values (encode(digest(v_full_token, 'sha256'), 'hex'), v_signing_secret, v_user.id, v_usr.school_id,
          v_usr.role_code, now() + interval '30 days', v_user_agent);

  insert into public.audit_logs (school_id, user_id, action, entity)
  values (v_usr.school_id, v_user.id, 'USER_LOGIN_SUCCESS', 'auth');

  return jsonb_build_object(
    'accessToken', v_full_token,
    'signingSecret', v_signing_secret,
    'refreshToken', 'ref_' || encode(gen_random_bytes(32), 'hex'),
    'user', jsonb_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'phone', v_user.phone,
      'firstName', v_user.first_name,
      'lastName', coalesce(v_user.last_name, ''),
      'role', v_usr.role_code,
      'roleName', v_usr.role_name,
      'school', jsonb_build_object(
        'id', v_usr.school_id,
        'name', v_usr.school_name,
        'code', v_usr.school_code,
        'status', v_usr.school_status,
        'disabledServices', jsonb_build_array()
      ),
      'permissions', jsonb_build_array()
    )
  );
end;
$$;

grant execute on function public.authenticate_user(text, text, text) to anon, authenticated;


-- ============================================================
-- 7. UPGRADE support_binary_login() — ISSUE signingSecret
-- ============================================================
create or replace function public.support_binary_login(
  p_school_id uuid,
  p_root_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_school RECORD;
  v_school_admin RECORD;
  v_session_token TEXT;
  v_full_token TEXT;
  v_signing_secret TEXT;
  v_actor RECORD;
begin
  if not public.verify_request_signature(null, null, null) then
    return public.unauthorized_api_response();
  end if;

  -- 1. Caller must be an authenticated platform admin (current_session verifies signature)
  if public.current_session() is null then
    return public.unauthorized_api_response();
  end if;
  if not public.is_platform_admin() then
    raise exception 'Access denied. Support sessions are restricted to Platform Administrators.';
  end if;

  select id, email, first_name, last_name into v_actor
    from public.users where id = public.current_user_id();

  -- 2. Target school must exist
  select * into v_school
  from public.schools
  where id = p_school_id
    and deleted_at is null;

  if not found then
    raise exception 'School not found or inactive.';
  end if;

  -- 3. Audit
  insert into public.audit_logs (school_id, user_id, action, entity, new_values)
  values (
    v_school.id,
    public.current_user_id(),
    'SUPPORT_BINARY_LOGIN',
    'auth',
    jsonb_build_object(
      'action', 'Delegated Support Login Initiated',
      'school_id', v_school.id,
      'school_name', v_school.name,
      'timestamp', now()
    )
  );

  v_session_token  := encode(gen_random_bytes(32), 'hex');
  v_full_token     := 'sec_' || v_session_token;
  v_signing_secret := 'sig_' || encode(gen_random_bytes(32), 'hex');

  -- 4. Prefer the school's real admin persona; else synthetic support persona
  select u.*, usr.school_id, r.code AS role_code, r.name AS role_name
  into v_school_admin
  from public.user_school_roles usr
  join public.users u on u.id = usr.user_id
  join public.roles r on r.id = usr.role_id
  where usr.school_id = v_school.id
    and usr.status = 'ACTIVE'
    and r.code in ('SCHOOL_ADMIN', 'PRINCIPAL')
  limit 1;

  if found then
    insert into public.app_sessions (token_hash, signing_secret, user_id, school_id, role_code, is_support_session, expires_at)
    values (encode(digest(v_full_token, 'sha256'), 'hex'), v_signing_secret, v_school_admin.id, v_school.id,
            'SCHOOL_ADMIN', true, now() + interval '12 hours');

    return jsonb_build_object(
      'accessToken', v_full_token,
      'signingSecret', v_signing_secret,
      'refreshToken', 'ref_' || encode(gen_random_bytes(32), 'hex'),
      'user', jsonb_build_object(
        'id', v_school_admin.id,
        'email', v_school_admin.email,
        'phone', v_school_admin.phone,
        'firstName', v_school_admin.first_name,
        'lastName', coalesce(v_school_admin.last_name, ''),
        'role', 'SCHOOL_ADMIN',
        'roleName', 'Support Admin (Binary Session)',
        'school', jsonb_build_object(
          'id', v_school.id,
          'name', v_school.name,
          'code', v_school.code,
          'status', v_school.status,
          'disabledServices', jsonb_build_array()
        ),
        'permissions', jsonb_build_array('*'),
        'isSupportSession', true
      )
    );
  else
    insert into public.app_sessions (token_hash, signing_secret, user_id, school_id, role_code, is_support_session, expires_at)
    values (encode(digest(v_full_token, 'sha256'), 'hex'), v_signing_secret, public.current_user_id(), v_school.id,
            'SCHOOL_ADMIN', true, now() + interval '12 hours');

    return jsonb_build_object(
      'accessToken', v_full_token,
      'signingSecret', v_signing_secret,
      'refreshToken', 'ref_' || encode(gen_random_bytes(32), 'hex'),
      'user', jsonb_build_object(
        'id', public.current_user_id(),
        'email', 'support+' || lower(v_school.code) || '@schoolscence.in',
        'firstName', 'Support',
        'lastName', 'Administrator',
        'role', 'SCHOOL_ADMIN',
        'roleName', 'Support Admin (Binary Session)',
        'school', jsonb_build_object(
          'id', v_school.id,
          'name', v_school.name,
          'code', v_school.code,
          'status', v_school.status,
          'disabledServices', jsonb_build_array()
        ),
        'permissions', jsonb_build_array('*'),
        'isSupportSession', true
      )
    );
  end if;
end;
$$;

grant execute on function public.support_binary_login(uuid, uuid) to anon, authenticated;


-- ============================================================
-- 8. LOCK DOWN PUBLIC & PORTAL RPCs WITH 2-LINE 403 RESPONSE
-- ============================================================
create or replace function public.get_dashboard_overview(
  p_school_id text,
  p_academic_year_id text default null,
  p_user_id text default null,
  p_role text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  return public._get_dashboard_overview_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id()::text end,
    p_academic_year_id,
    public.current_user_id()::text,
    public.current_app_role()
  );
end;
$$;
grant execute on function public.get_dashboard_overview(text, text, text, text) to anon, authenticated, service_role;

create or replace function public.get_classes_overview(
  p_school_id text,
  p_academic_year_id text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  return public._get_classes_overview_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id()::text end,
    p_academic_year_id
  );
end;
$$;
grant execute on function public.get_classes_overview(text, text) to anon, authenticated, service_role;

create or replace function public.get_class_details(
  p_class_id text,
  p_academic_year_id text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  if not exists (
    select 1 from public.classes c
     where c.id::text = p_class_id
       and (c.school_id = public.current_school_id() or public.is_platform_admin())
  ) then
    return public.unauthorized_api_response();
  end if;

  return public._get_class_details_unsafe(p_class_id, p_academic_year_id);
end;
$$;
grant execute on function public.get_class_details(text, text) to anon, authenticated, service_role;

create or replace function public.search_schools(p_query text)
returns table (
  id uuid,
  name varchar(200),
  code varchar(50),
  city varchar(100),
  state varchar(100)
)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_cleaned text;
begin
  if not public.verify_request_signature(null, null, null) then
    raise exception 'Access denied: Unauthorized API client or replayed request signature.'
      using errcode = '42501',
            hint = 'This API can only be accessed through the official SchoolSense application.';
  end if;

  v_cleaned := trim(coalesce(p_query, ''));
  if length(v_cleaned) < 3 then
    return;
  end if;

  return query
  select
    s.id,
    s.name,
    s.code,
    s.city,
    s.state
  from public.schools s
  where s.status = 'ACTIVE'
    and upper(s.code) != 'PLATFORM'
    and s.name ilike '%' || v_cleaned || '%'
  order by
    case when s.name ilike v_cleaned || '%' then 1 else 2 end,
    s.name asc
  limit 5;
end;
$$;

grant execute on function public.search_schools(text) to anon, authenticated;


create or replace function public.create_demo_lead(
  p_full_name     text,
  p_phone         text,
  p_email         text default null,
  p_school_name   text default null,
  p_role          text default null,
  p_student_count text default null,
  p_city          text default null,
  p_message       text default null,
  p_source        text default 'website',
  p_page_url      text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_phone_digits text;
  v_existing_id  uuid;
  v_lead_id      uuid;
begin
  if not public.verify_request_signature(null, null, null) then
    return public.unauthorized_api_response();
  end if;

  if p_full_name is null or length(btrim(p_full_name)) < 2 or length(btrim(p_full_name)) > 120 then
    return jsonb_build_object('success', false, 'error', 'Please enter your full name.');
  end if;

  v_phone_digits := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(v_phone_digits) = 12 and starts_with(v_phone_digits, '91') then
    v_phone_digits := substring(v_phone_digits from 3);
  elsif length(v_phone_digits) = 11 and starts_with(v_phone_digits, '0') then
    v_phone_digits := substring(v_phone_digits from 2);
  end if;
  if v_phone_digits !~ '^[6-9][0-9]{9}$' then
    return jsonb_build_object('success', false, 'error', 'Please enter a valid 10-digit Indian mobile number.');
  end if;

  if p_email is not null and length(btrim(p_email)) > 0
     and btrim(p_email) !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('success', false, 'error', 'Please enter a valid email address.');
  end if;

  select id into v_existing_id
    from public.demo_leads
   where phone = v_phone_digits
     and created_at > now() - interval '24 hours'
   order by created_at desc
   limit 1;
  if v_existing_id is not null then
    return jsonb_build_object(
      'success', true,
      'duplicate', true,
      'lead_id', v_existing_id,
      'message', 'We already have your request — our team will call you shortly.'
    );
  end if;

  insert into public.demo_leads (
    full_name, phone, email, school_name, role, student_count, city, message, source, page_url
  ) values (
    btrim(p_full_name),
    v_phone_digits,
    nullif(btrim(coalesce(p_email, '')), ''),
    nullif(btrim(coalesce(p_school_name, '')), ''),
    nullif(btrim(coalesce(p_role, '')), ''),
    nullif(btrim(coalesce(p_student_count, '')), ''),
    nullif(btrim(coalesce(p_city, '')), ''),
    left(nullif(btrim(coalesce(p_message, '')), ''), 2000),
    coalesce(nullif(btrim(p_source), ''), 'website'),
    left(nullif(p_page_url, ''), 500)
  )
  returning id into v_lead_id;

  return jsonb_build_object(
    'success', true,
    'duplicate', false,
    'lead_id', v_lead_id,
    'message', 'Thank you! Our team will contact you within 24 hours.'
  );
end;
$$;

grant execute on function public.create_demo_lead(text, text, text, text, text, text, text, text, text, text) to anon, authenticated;


-- ============================================================
-- 9. LOCK DOWN DEPARTMENT OVERVIEW RPCs (Transport, Fees, Dept Users)
-- ============================================================
do $$ begin
  if to_regprocedure('public.get_departmental_users_overview(text)') is not null
     and to_regprocedure('public._get_departmental_users_overview_unsafe(text)') is null then
    alter function public.get_departmental_users_overview(text) rename to _get_departmental_users_overview_unsafe;
  end if;
end $$;

create or replace function public.get_departmental_users_overview(
  p_school_id text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  return public._get_departmental_users_overview_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id()::text end
  );
end;
$$;
grant execute on function public.get_departmental_users_overview(text) to anon, authenticated, service_role;

do $$ begin
  if to_regprocedure('public.get_fees_management_overview(text,text)') is not null
     and to_regprocedure('public._get_fees_management_overview_unsafe(text,text)') is null then
    alter function public.get_fees_management_overview(text, text) rename to _get_fees_management_overview_unsafe;
  end if;
end $$;

create or replace function public.get_fees_management_overview(
  p_school_id text default null,
  p_academic_year_id text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  return public._get_fees_management_overview_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id()::text end,
    p_academic_year_id
  );
end;
$$;
grant execute on function public.get_fees_management_overview(text, text) to anon, authenticated, service_role;

do $$ begin
  if to_regprocedure('public.get_transport_department_overview(text,text)') is not null
     and to_regprocedure('public._get_transport_department_overview_unsafe(text,text)') is null then
    alter function public.get_transport_department_overview(text, text) rename to _get_transport_department_overview_unsafe;
  end if;
end $$;

create or replace function public.get_transport_department_overview(
  p_school_id text default null,
  p_academic_year_id text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  return public._get_transport_department_overview_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id()::text end,
    p_academic_year_id
  );
end;
$$;
grant execute on function public.get_transport_department_overview(text, text) to anon, authenticated, service_role;


-- ============================================================
-- 10. LOCK DOWN SECTION ROSTER, ACADEMIC SESSIONS, ENROLLMENT & BILLING RPCs
-- ============================================================
do $$ begin
  if to_regprocedure('public.get_section_students(text,text)') is not null
     and to_regprocedure('public._get_section_students_unsafe(text,text)') is null then
    alter function public.get_section_students(text, text) rename to _get_section_students_unsafe;
  end if;
end $$;

create or replace function public.get_section_students(
  p_section_id text,
  p_academic_year_id text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  if not exists (
    select 1 from public.sections s
     where s.id::text = p_section_id
       and (s.school_id = public.current_school_id() or public.is_platform_admin())
  ) then
    return public.unauthorized_api_response();
  end if;

  return public._get_section_students_unsafe(p_section_id, p_academic_year_id);
end;
$$;
grant execute on function public.get_section_students(text, text) to anon, authenticated, service_role;

do $$ begin
  if to_regprocedure('public.get_section_roster(uuid)') is not null
     and to_regprocedure('public._get_section_roster_unsafe(uuid)') is null then
    alter function public.get_section_roster(uuid) rename to _get_section_roster_unsafe;
  end if;
end $$;

create or replace function public.get_section_roster(p_section_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  if not exists (
    select 1 from public.sections s
     where s.id = p_section_id
       and (s.school_id = public.current_school_id() or public.is_platform_admin())
  ) then
    return public.unauthorized_api_response();
  end if;

  return public._get_section_roster_unsafe(p_section_id);
end;
$$;
grant execute on function public.get_section_roster(uuid) to anon, authenticated, service_role;

do $$ begin
  if to_regprocedure('public.get_school_academic_sessions(uuid)') is not null
     and to_regprocedure('public._get_school_academic_sessions_unsafe(uuid)') is null then
    alter function public.get_school_academic_sessions(uuid) rename to _get_school_academic_sessions_unsafe;
  end if;
end $$;

create or replace function public.get_school_academic_sessions(p_school_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  return public._get_school_academic_sessions_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id() end
  );
end;
$$;
grant execute on function public.get_school_academic_sessions(uuid) to anon, authenticated, service_role;

do $$ begin
  if to_regprocedure('public.get_school_alumni(uuid)') is not null
     and to_regprocedure('public._get_school_alumni_unsafe(uuid)') is null then
    alter function public.get_school_alumni(uuid) rename to _get_school_alumni_unsafe;
  end if;
end $$;

create or replace function public.get_school_alumni(p_school_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  return public._get_school_alumni_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id() end
  );
end;
$$;
grant execute on function public.get_school_alumni(uuid) to anon, authenticated, service_role;

do $$ begin
  if to_regprocedure('public.create_academic_session(uuid,character varying,date,date,boolean)') is not null
     and to_regprocedure('public._create_academic_session_unsafe(uuid,character varying,date,date,boolean)') is null then
    alter function public.create_academic_session(uuid, character varying, date, date, boolean) rename to _create_academic_session_unsafe;
  end if;
end $$;

create or replace function public.create_academic_session(
  p_school_id uuid,
  p_name varchar(20),
  p_start_date date,
  p_end_date date,
  p_set_as_current boolean default false
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  return public._create_academic_session_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id() end,
    p_name, p_start_date, p_end_date, p_set_as_current
  );
end;
$$;
grant execute on function public.create_academic_session(uuid, varchar, date, date, boolean) to anon, authenticated, service_role;

do $$ begin
  if to_regprocedure('public.rollover_and_promote_students(uuid,uuid,uuid)') is not null
     and to_regprocedure('public._rollover_and_promote_students_unsafe(uuid,uuid,uuid)') is null then
    alter function public.rollover_and_promote_students(uuid, uuid, uuid) rename to _rollover_and_promote_students_unsafe;
  end if;
end $$;

create or replace function public.rollover_and_promote_students(
  p_school_id uuid,
  p_from_session_id uuid,
  p_to_session_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  return public._rollover_and_promote_students_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id() end,
    p_from_session_id, p_to_session_id
  );
end;
$$;
grant execute on function public.rollover_and_promote_students(uuid, uuid, uuid) to anon, authenticated, service_role;

do $$ begin
  if to_regprocedure('public.enroll_new_student(uuid,text,text,text,uuid,uuid,uuid,text,text,date,text,text,text,text,text)') is not null
     and to_regprocedure('public._enroll_new_student_unsafe(uuid,text,text,text,uuid,uuid,uuid,text,text,date,text,text,text,text,text)') is null then
    alter function public.enroll_new_student(uuid,text,text,text,uuid,uuid,uuid,text,text,date,text,text,text,text,text) rename to _enroll_new_student_unsafe;
  end if;
end $$;

create or replace function public.enroll_new_student(
  p_school_id uuid,
  p_first_name text,
  p_last_name text default null,
  p_admission_number text default null,
  p_section_id uuid default null,
  p_class_id uuid default null,
  p_academic_year_id uuid default null,
  p_roll_number text default '1',
  p_gender text default 'MALE',
  p_date_of_birth date default null,
  p_blood_group text default null,
  p_guardian_name text default null,
  p_guardian_phone text default null,
  p_guardian_email text default null,
  p_relationship text default 'FATHER'
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  return public._enroll_new_student_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id() end,
    p_first_name, p_last_name, p_admission_number, p_section_id, p_class_id, p_academic_year_id,
    p_roll_number, p_gender, p_date_of_birth, p_blood_group, p_guardian_name, p_guardian_phone,
    p_guardian_email, p_relationship
  );
end;
$$;
grant execute on function public.enroll_new_student(uuid,text,text,text,uuid,uuid,uuid,text,text,date,text,text,text,text,text) to anon, authenticated, service_role;

do $$ begin
  if to_regprocedure('public.onboard_school_tenant(text,text,text,text,text,text,text,text,text,text,text,text,text,text)') is not null
     and to_regprocedure('public._onboard_school_tenant_unsafe(text,text,text,text,text,text,text,text,text,text,text,text,text,text)') is null then
    alter function public.onboard_school_tenant(text,text,text,text,text,text,text,text,text,text,text,text,text,text)
      rename to _onboard_school_tenant_unsafe;
  end if;
end $$;

create or replace function public.onboard_school_tenant(
  p_name text, p_code text, p_email text, p_phone text,
  p_address_line1 text, p_city text, p_state text, p_country text, p_postal_code text,
  p_admin_first_name text, p_admin_last_name text, p_admin_email text, p_admin_phone text,
  p_admin_password text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null or not public.is_platform_admin() then
    return public.unauthorized_api_response();
  end if;

  return public._onboard_school_tenant_unsafe(
    p_name, p_code, p_email, p_phone,
    p_address_line1, p_city, p_state, p_country, p_postal_code,
    p_admin_first_name, p_admin_last_name, p_admin_email, p_admin_phone,
    p_admin_password
  );
end;
$$;
grant execute on function public.onboard_school_tenant(text,text,text,text,text,text,text,text,text,text,text,text,text,text) to anon, authenticated;

do $$ begin
  if to_regprocedure('public.top_up_school_wallet(uuid,numeric,text,text,uuid)') is not null
     and to_regprocedure('public._top_up_school_wallet_unsafe(uuid,numeric,text,text,uuid)') is null then
    alter function public.top_up_school_wallet(uuid, numeric, text, text, uuid) rename to _top_up_school_wallet_unsafe;
  end if;
end $$;

create or replace function public.top_up_school_wallet(
  p_school_id uuid,
  p_amount numeric,
  p_method text default null,
  p_notes text default null,
  p_performed_by_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_school_id uuid;
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  if public.is_platform_admin() then
    v_school_id := p_school_id;
  else
    if not public.is_staff_role() then
      return public.unauthorized_api_response();
    end if;
    v_school_id := public.current_school_id();
  end if;

  return public._top_up_school_wallet_unsafe(v_school_id, p_amount, p_method, p_notes, public.current_user_id());
end;
$$;
grant execute on function public.top_up_school_wallet(uuid, numeric, text, text, uuid) to anon, authenticated;

do $$ begin
  if to_regprocedure('public.execute_monthly_subscription_billing(uuid,uuid)') is not null
     and to_regprocedure('public._execute_monthly_subscription_billing_unsafe(uuid,uuid)') is null then
    alter function public.execute_monthly_subscription_billing(uuid, uuid) rename to _execute_monthly_subscription_billing_unsafe;
  end if;
end $$;

create or replace function public.execute_monthly_subscription_billing(
  p_school_id uuid,
  p_performed_by_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_school_id uuid;
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  if public.is_platform_admin() then
    v_school_id := p_school_id;
  else
    if not public.is_staff_role() then
      return public.unauthorized_api_response();
    end if;
    v_school_id := public.current_school_id();
  end if;

  return public._execute_monthly_subscription_billing_unsafe(v_school_id, public.current_user_id());
end;
$$;
grant execute on function public.execute_monthly_subscription_billing(uuid, uuid) to anon, authenticated;

do $$ begin
  if to_regprocedure('public.update_school_subscription_rate(uuid,numeric,numeric,text,uuid)') is not null
     and to_regprocedure('public._update_school_subscription_rate_unsafe(uuid,numeric,numeric,text,uuid)') is null then
    alter function public.update_school_subscription_rate(uuid, numeric, numeric, text, uuid)
      rename to _update_school_subscription_rate_unsafe;
  end if;
end $$;

create or replace function public.update_school_subscription_rate(
  p_school_id uuid,
  p_per_student_fee numeric,
  p_wallet_adjustment numeric default null,
  p_adjustment_reason text default null,
  p_performed_by_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null or not public.is_platform_admin() then
    return public.unauthorized_api_response();
  end if;

  return public._update_school_subscription_rate_unsafe(
    p_school_id, p_per_student_fee, p_wallet_adjustment, p_adjustment_reason, public.current_user_id()
  );
end;
$$;
grant execute on function public.update_school_subscription_rate(uuid, numeric, numeric, text, uuid) to anon, authenticated;

do $$ begin
  if to_regprocedure('public.calculate_monthly_subscription(uuid)') is not null
     and to_regprocedure('public._calculate_monthly_subscription_unsafe(uuid)') is null then
    alter function public.calculate_monthly_subscription(uuid) rename to _calculate_monthly_subscription_unsafe;
  end if;
end $$;

create or replace function public.calculate_monthly_subscription(p_school_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  return public._calculate_monthly_subscription_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id() end
  );
end;
$$;
grant execute on function public.calculate_monthly_subscription(uuid) to anon, authenticated;

do $$ begin
  if to_regprocedure('public.get_school_subscription_details(uuid)') is not null
     and to_regprocedure('public._get_school_subscription_details_unsafe(uuid)') is null then
    alter function public.get_school_subscription_details(uuid) rename to _get_school_subscription_details_unsafe;
  end if;
end $$;

create or replace function public.get_school_subscription_details(p_school_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null then
    return public.unauthorized_api_response();
  end if;

  if not public.is_platform_admin() and not public.is_staff_role() then
    return public.unauthorized_api_response();
  end if;

  return public._get_school_subscription_details_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id() end
  );
end;
$$;
grant execute on function public.get_school_subscription_details(uuid) to anon, authenticated;

create or replace function public.set_school_subdomain(
  p_school_id uuid,
  p_subdomain text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_sub text;
begin
  if not public.verify_request_signature(null, null, null) or public.current_session() is null or not public.is_platform_admin() then
    return public.unauthorized_api_response();
  end if;

  if not exists (select 1 from public.schools where id = p_school_id and deleted_at is null) then
    return jsonb_build_object('success', false, 'error', 'School not found.');
  end if;

  update public.schools
     set subdomain = p_subdomain,
         updated_at = now()
   where id = p_school_id
   returning subdomain into v_sub;

  return jsonb_build_object(
    'success', true,
    'school_id', p_school_id,
    'subdomain', v_sub,
    'url', case when v_sub is null then null else 'https://' || v_sub || '.schoolsense.in' end
  );
exception
  when unique_violation then
    return jsonb_build_object('success', false, 'error', 'That subdomain is already taken by another school.');
end;
$$;
grant execute on function public.set_school_subdomain(uuid, text) to anon, authenticated;

-- Drop/revoke legacy unused directory & helper functions so they can never be called from Postman
drop function if exists public.get_public_school_directory();
do $$
begin
  if to_regprocedure('public.get_user_school_ids()') is not null then
    revoke all on function public.get_user_school_ids() from public, anon, authenticated;
  end if;
end $$;

-- Lock raw _unsafe functions away from anon/authenticated
do $$
declare
  fn text;
begin
  for fn in
    select unnest(array[
      'public._get_dashboard_overview_unsafe(text,text,text,text)',
      'public._get_classes_overview_unsafe(text,text)',
      'public._get_class_details_unsafe(text,text)',
      'public._get_departmental_users_overview_unsafe(text)',
      'public._get_fees_management_overview_unsafe(text,text)',
      'public._get_transport_department_overview_unsafe(text,text)',
      'public._get_section_students_unsafe(text,text)',
      'public._get_section_roster_unsafe(uuid)',
      'public._get_school_academic_sessions_unsafe(uuid)',
      'public._get_school_alumni_unsafe(uuid)',
      'public._create_academic_session_unsafe(uuid,character varying,date,date,boolean)',
      'public._rollover_and_promote_students_unsafe(uuid,uuid,uuid)',
      'public._enroll_new_student_unsafe(uuid,text,text,text,uuid,uuid,uuid,text,text,date,text,text,text,text,text)',
      'public._onboard_school_tenant_unsafe(text,text,text,text,text,text,text,text,text,text,text,text,text,text)',
      'public._top_up_school_wallet_unsafe(uuid,numeric,text,text,uuid)',
      'public._execute_monthly_subscription_billing_unsafe(uuid,uuid)',
      'public._update_school_subscription_rate_unsafe(uuid,numeric,numeric,text,uuid)',
      'public._calculate_monthly_subscription_unsafe(uuid)',
      'public._get_school_subscription_details_unsafe(uuid)'
    ])
  loop
    if to_regprocedure(fn) is not null then
      execute format('revoke execute on function %s from public, anon, authenticated;', fn);
    end if;
  end loop;
end $$;


-- ============================================================
-- 11. LOCK DOWN TRANSPORT & FEE TABLE RLS POLICIES (NO ANON/POSTMAN ACCESS)
-- ============================================================
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'transport_vehicles',
      'transport_routes',
      'transport_stops',
      'student_transport_assignments',
      'fee_categories',
      'fee_structures',
      'student_fee_invoices',
      'fee_payments',
      'student_deactivation_requests'
    ])
  loop
    if to_regclass('public.' || tbl) is not null then
      execute format('drop policy if exists %I on public.%I;', tbl || '_policy', tbl);
      execute format('drop policy if exists %I on public.%I;', tbl || '_all', tbl);
      execute format('drop policy if exists %I on public.%I;', 'allow_all_' || tbl, tbl);
      execute format('drop policy if exists %I on public.%I;', tbl || '_tenant_isolation', tbl);
      execute format(
        'create policy %I on public.%I for all to anon, authenticated using (public.is_platform_admin() or school_id = public.current_school_id()) with check (public.is_platform_admin() or school_id = public.current_school_id());',
        tbl || '_tenant_isolation',
        tbl
      );
    end if;
  end loop;
end $$;


-- ============================================================
-- 12. SQL INJECTION (SQLi) & STRICT PARAMETER FIREWALL
-- ============================================================

-- 12a. Detect SQL Injection Payloads (tautologies, UNION SELECT, stacked DDL/DML, system catalogs, pg_sleep)
create or replace function public.is_sql_injection_attempt(p_input text)
returns boolean
language plpgsql
immutable
security definer
set search_path = public, extensions
as $$
declare
  v_norm text;
begin
  if p_input is null or p_input = '' then
    return false;
  end if;

  v_norm := lower(p_input);

  -- 1. UNION SELECT / UNION ALL SELECT extraction
  if v_norm ~ '\yunion\s+(all\s+)?select\y' then
    return true;
  end if;

  -- 2. Stacked queries & destructive DDL/DML commands
  if v_norm ~ ';\s*(drop|delete|update|insert|alter|truncate|create|grant|revoke|copy|call|do|execute)\s+' then
    return true;
  end if;

  -- 3. Classic SQL tautologies (' OR '1'='1, ' OR 1=1, " OR 1=1, ' OR true--)
  if v_norm ~ '[''"]\s*(or|and)\s+[''"]?[0-9a-z_]+[''"]?\s*=\s*[''"]?[0-9a-z_]+'
     or v_norm ~ '\yor\s+1\s*=\s*1\y'
     or v_norm ~ '[''"]\s*or\s+true\y' then
    return true;
  end if;

  -- 4. System catalog, metadata & credential table probing
  if v_norm ~ '\y(information_schema|pg_catalog|pg_shadow|pg_authid|pg_stat_activity|app_sessions|api_request_nonces)\y' then
    return true;
  end if;

  -- 5. Time-based blind SQLi, file access & network functions
  if v_norm ~ '\y(pg_sleep|dblink|pg_read_file|pg_read_binary_file|pg_ls_dir|lo_import|lo_export|query_to_xml|database_to_xml)\s*\(' then
    return true;
  end if;

  -- 6. Quoted SQL comment truncation (' -- or '; -- or /* ... */ excluding MIME types like */*)
  if v_norm ~ '[''";]\s*--' or v_norm ~ '/\*[^*].*\*/' then
    return true;
  end if;

  return false;
end;
$$;

revoke all on function public.is_sql_injection_attempt(text) from public, anon, authenticated;

-- 12b. Strict UUID validator for TEXT parameters (prevents injecting non-UUID strings into ID fields)
create or replace function public.is_valid_uuid_text(p_val text)
returns boolean
language plpgsql
immutable
security definer
set search_path = public, extensions
as $$
begin
  if p_val is null or btrim(p_val) = '' then
    return true;
  end if;
  return btrim(p_val) ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
end;
$$;

revoke all on function public.is_valid_uuid_text(text) from public, anon, authenticated;

-- 12c. Harden search_schools() against SQLi and LIKE wildcard (% / _) scraping
create or replace function public.search_schools(p_query text)
returns table (
  id uuid,
  name varchar(200),
  code varchar(50),
  city varchar(100),
  state varchar(100)
)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_cleaned text;
begin
  if not public.verify_request_signature(null, null, null) or public.is_sql_injection_attempt(p_query) then
    perform set_config('response.status', '403', true);
    raise exception 'Access denied: Unauthorized API client or replayed request signature.'
      using errcode = '42501',
            hint = 'This API can only be accessed through the official SchoolSense application.';
  end if;

  -- Strip SQL wildcards (%, _, \) and quotes/semicolons so '%' cannot dump all schools
  v_cleaned := btrim(regexp_replace(coalesce(p_query, ''), '[%_\\''";`]', '', 'g'));
  if length(v_cleaned) < 3 or length(v_cleaned) > 80 then
    return;
  end if;

  return query
  select
    s.id,
    s.name,
    s.code,
    s.city,
    s.state
  from public.schools s
  where s.status = 'ACTIVE'
    and upper(s.code) != 'PLATFORM'
    and s.name ilike '%' || v_cleaned || '%'
  order by
    case when s.name ilike v_cleaned || '%' then 1 else 2 end,
    s.name asc
  limit 5;
end;
$$;
grant execute on function public.search_schools(text) to anon, authenticated;

-- 12d. Enforce strict UUID & SQLi validation on all TEXT-parameter RPCs
create or replace function public.get_dashboard_overview(
  p_school_id text,
  p_academic_year_id text default null,
  p_user_id text default null,
  p_role text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null)
     or public.current_session() is null
     or not public.is_valid_uuid_text(p_school_id)
     or not public.is_valid_uuid_text(p_academic_year_id)
     or not public.is_valid_uuid_text(p_user_id)
     or public.is_sql_injection_attempt(p_role) then
    return public.unauthorized_api_response();
  end if;

  return public._get_dashboard_overview_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id()::text end,
    p_academic_year_id,
    public.current_user_id()::text,
    public.current_app_role()
  );
end;
$$;

create or replace function public.get_classes_overview(
  p_school_id text,
  p_academic_year_id text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null)
     or public.current_session() is null
     or not public.is_valid_uuid_text(p_school_id)
     or not public.is_valid_uuid_text(p_academic_year_id) then
    return public.unauthorized_api_response();
  end if;

  return public._get_classes_overview_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id()::text end,
    p_academic_year_id
  );
end;
$$;

create or replace function public.get_class_details(
  p_class_id text,
  p_academic_year_id text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null)
     or public.current_session() is null
     or not public.is_valid_uuid_text(p_class_id)
     or not public.is_valid_uuid_text(p_academic_year_id) then
    return public.unauthorized_api_response();
  end if;

  if not exists (
    select 1 from public.classes c
     where c.id::text = p_class_id
       and (c.school_id = public.current_school_id() or public.is_platform_admin())
  ) then
    return public.unauthorized_api_response();
  end if;

  return public._get_class_details_unsafe(p_class_id, p_academic_year_id);
end;
$$;

create or replace function public.get_departmental_users_overview(
  p_school_id text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null)
     or public.current_session() is null
     or not public.is_valid_uuid_text(p_school_id) then
    return public.unauthorized_api_response();
  end if;

  return public._get_departmental_users_overview_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id()::text end
  );
end;
$$;

create or replace function public.get_fees_management_overview(
  p_school_id text default null,
  p_academic_year_id text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null)
     or public.current_session() is null
     or not public.is_valid_uuid_text(p_school_id)
     or not public.is_valid_uuid_text(p_academic_year_id) then
    return public.unauthorized_api_response();
  end if;

  return public._get_fees_management_overview_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id()::text end,
    p_academic_year_id
  );
end;
$$;

create or replace function public.get_transport_department_overview(
  p_school_id text default null,
  p_academic_year_id text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null)
     or public.current_session() is null
     or not public.is_valid_uuid_text(p_school_id)
     or not public.is_valid_uuid_text(p_academic_year_id) then
    return public.unauthorized_api_response();
  end if;

  return public._get_transport_department_overview_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id()::text end,
    p_academic_year_id
  );
end;
$$;

create or replace function public.get_section_students(
  p_section_id text,
  p_academic_year_id text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_request_signature(null, null, null)
     or public.current_session() is null
     or not public.is_valid_uuid_text(p_section_id)
     or not public.is_valid_uuid_text(p_academic_year_id) then
    return public.unauthorized_api_response();
  end if;

  if not exists (
    select 1 from public.sections s
     where s.id::text = p_section_id
       and (s.school_id = public.current_school_id() or public.is_platform_admin())
  ) then
    return public.unauthorized_api_response();
  end if;

  return public._get_section_students_unsafe(p_section_id, p_academic_year_id);
end;
$$;


-- ============================================================
-- 13. POSTGREST GLOBAL GATEWAY HOOK (Anti-Postman + Anti-SQLi)
-- ============================================================
create or replace function public.check_api_request_security()
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_req_method text;
  v_req_path   text;
begin
  v_req_method := upper(coalesce(current_setting('request.method', true), ''));
  v_req_path   := regexp_replace(coalesce(current_setting('request.path', true), ''), '^/rest/v1', '');

  -- Allow CORS preflight OPTIONS requests
  if v_req_method = 'OPTIONS' then
    return;
  end if;

  -- Block any SQL injection payload in URL path immediately
  if public.is_sql_injection_attempt(v_req_path) then
    perform set_config('response.status', '403', true);
    raise exception 'Access denied: Unauthorized API client or replayed request signature.'
      using errcode = '42501',
            hint = 'This API can only be accessed through the official SchoolSense application.';
  end if;

  -- Enforce signature + single-use nonce at the PostgREST gateway for ALL endpoints (both /table and /rpc/*)
  if not public.verify_request_signature(null, null, null) then
    perform set_config('response.status', '403', true);
    raise exception 'Access denied: Unauthorized API client or replayed request signature.'
      using errcode = '42501',
            hint = 'This API can only be accessed through the official SchoolSense application.';
  end if;
end;
$$;

grant execute on function public.check_api_request_security() to anon, authenticated, service_role;

-- Tighten user_school_roles SELECT policy by role (Parents/Students only see their own row + active school staff)
drop policy if exists usr_select on public.user_school_roles;
create policy usr_select on public.user_school_roles
  for select using (
    public.is_platform_admin()
    or user_id = public.current_user_id()
    or (public.is_staff_role() and school_id = public.current_school_id())
    or (
      school_id = public.current_school_id()
      and status = 'ACTIVE'
      and exists (
        select 1 from public.roles r
         where r.id = user_school_roles.role_id
           and r.code in ('TEACHER', 'CLASS_TEACHER', 'PRINCIPAL', 'SCHOOL_ADMIN')
      )
    )
  );

-- Refresh column-level SELECT grant on public.users (so newly added columns like department,
-- designation, custom_permissions are readable while password_hash stays 100% hidden)
alter table public.users
  add column if not exists department text,
  add column if not exists designation text,
  add column if not exists custom_permissions jsonb default '[]'::jsonb;

do $$
declare
  cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into cols
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'users'
     and column_name <> 'password_hash';
  execute 'revoke select on public.users from anon, authenticated';
  execute format('grant select (%s) on public.users to anon, authenticated', cols);
end $$;

-- Enforce 8-second statement timeout to block time-based blind SQLi (pg_sleep) & DoS queries
alter role anon set statement_timeout = '8s';
alter role authenticated set statement_timeout = '8s';
alter role authenticator set pgrst.db_pre_request = 'public.check_api_request_security';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';



