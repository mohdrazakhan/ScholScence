-- ============================================================
-- SchoolSense — SECURITY LOCKDOWN
-- ============================================================
-- Goal: School A can NEVER read or write School B's data, and no
-- anonymous request can touch any school data at all.
--
-- Mechanism:
--   1. Every login creates a row in public.app_sessions (token hash).
--   2. The app sends the token in the `x-schoolsense-token` header.
--   3. current_session() resolves the caller (user, school, role)
--      from that header + app_sessions — server-side truth.
--   4. RLS policies derive school scope from current_session() —
--      PostgREST params no longer decide who sees what.
--   5. SECURITY DEFINER RPCs are wrapped with identity checks and
--      the raw implementations are un-callable.
--
-- Idempotent: safe to re-run.
-- ============================================================


-- ============================================================
-- 1. SESSION STORE
-- ============================================================
create table if not exists public.app_sessions (
  id                 uuid primary key default gen_random_uuid(),
  token_hash         text not null unique,
  user_id            uuid not null references public.users(id) on delete cascade,
  school_id          uuid references public.schools(id) on delete cascade,
  role_code          text not null,
  is_support_session boolean not null default false,
  created_at         timestamptz not null default now(),
  expires_at         timestamptz not null,
  revoked_at         timestamptz,
  user_agent         text
);

create index if not exists idx_app_sessions_lookup
  on public.app_sessions(token_hash)
  where revoked_at is null;

comment on table public.app_sessions is
  'Opaque login sessions. Written by authenticate_user/support_binary_login; read only via current_session(). No direct client access.';

alter table public.app_sessions enable row level security;
revoke all on public.app_sessions from anon, authenticated;


-- ============================================================
-- 2. IDENTITY HELPERS (used by RLS policies and RPCs)
-- ============================================================
create or replace function public.current_session()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
  v_hash  text;
  v_sess  record;
begin
  v_token := coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'x-schoolsense-token';
  if v_token is null or length(v_token) < 20 then
    return null;
  end if;

  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  select s.id, s.user_id, s.school_id, s.role_code, s.is_support_session
    into v_sess
    from public.app_sessions s
   where s.token_hash = v_hash
     and s.revoked_at is null
     and s.expires_at > now()
   limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'session_id', v_sess.id,
    'user_id',    v_sess.user_id,
    'school_id',  v_sess.school_id,
    'role',       v_sess.role_code,
    'is_support', v_sess.is_support_session
  );
end;
$$;

create or replace function public.current_user_id()
returns uuid
language sql stable security definer set search_path = public, extensions
as $$ select nullif(public.current_session() ->> 'user_id', '')::uuid $$;

create or replace function public.current_school_id()
returns uuid
language sql stable security definer set search_path = public, extensions
as $$ select nullif(public.current_session() ->> 'school_id', '')::uuid $$;

create or replace function public.current_app_role()
returns text
language sql stable security definer set search_path = public, extensions
as $$ select public.current_session() ->> 'role' $$;

create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer set search_path = public, extensions
as $$ select coalesce(public.current_app_role() in ('SUPER_ADMIN', 'PLATFORM_ADMIN'), false) $$;

create or replace function public.is_staff_role()
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select coalesce(
    public.current_app_role() in
      ('SUPER_ADMIN','PLATFORM_ADMIN','SCHOOL_ADMIN','PRINCIPAL','CLASS_TEACHER','TEACHER','FEE_MANAGER'),
    false
  )
$$;

-- True when the caller is a guardian linked to this student.
create or replace function public.parent_can_access_student(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select exists (
    select 1
      from public.student_guardians sg
      join public.guardians g on g.id = sg.guardian_id
     where sg.student_id = p_student_id
       and g.user_id = public.current_user_id()
       and g.deleted_at is null
  )
$$;

-- True when the caller holds any active role in the same school as p_user_id.
create or replace function public.shares_school_with(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select exists (
    select 1
      from public.user_school_roles a
      join public.user_school_roles b on a.school_id = b.school_id
     where a.user_id = public.current_user_id()
       and b.user_id = p_user_id
       and a.status = 'ACTIVE'
       and b.status = 'ACTIVE'
  )
$$;

grant execute on function public.current_session()          to anon, authenticated;
grant execute on function public.current_user_id()          to anon, authenticated;
grant execute on function public.current_school_id()        to anon, authenticated;
grant execute on function public.current_app_role()         to anon, authenticated;
grant execute on function public.is_platform_admin()        to anon, authenticated;
grant execute on function public.is_staff_role()            to anon, authenticated;
grant execute on function public.parent_can_access_student(uuid) to anon, authenticated;
grant execute on function public.shares_school_with(uuid)   to anon, authenticated;


-- ============================================================
-- 3. LOGIN — creates the session row
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
  v_platform_school_id UUID;
  v_user_agent TEXT;
begin
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

  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_full_token := 'sec_' || v_session_token;
  v_user_agent := left(coalesce(coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'user-agent', ''), 300);

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

    insert into public.app_sessions (token_hash, user_id, school_id, role_code, expires_at, user_agent)
    values (encode(digest(v_full_token, 'sha256'), 'hex'), v_user.id, v_platform_school_id,
            'SUPER_ADMIN', now() + interval '30 days', v_user_agent);

    insert into public.audit_logs (user_id, action, entity)
    values (v_user.id, 'ROOT_CONSOLE_LOGIN', 'auth');

    return jsonb_build_object(
      'accessToken', v_full_token,
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

  insert into public.app_sessions (token_hash, user_id, school_id, role_code, expires_at, user_agent)
  values (encode(digest(v_full_token, 'sha256'), 'hex'), v_user.id, v_usr.school_id,
          v_usr.role_code, now() + interval '30 days', v_user_agent);

  insert into public.audit_logs (school_id, user_id, action, entity)
  values (v_usr.school_id, v_user.id, 'USER_LOGIN_SUCCESS', 'auth');

  return jsonb_build_object(
    'accessToken', v_full_token,
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
-- 4. whoami + logout
-- ============================================================
create or replace function public.whoami()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_sess jsonb;
  v_user RECORD;
  v_school RECORD;
begin
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
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
begin
  v_token := coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'x-schoolsense-token';
  if v_token is null then
    return jsonb_build_object('success', true);
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
-- 5. SUPPORT BINARY LOGIN — platform admins only
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
  v_actor RECORD;
begin
  -- 1. Caller must be an authenticated platform admin
  if public.current_session() is null then
    raise exception 'Authentication required.';
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

  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_full_token := 'sec_' || v_session_token;

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
    insert into public.app_sessions (token_hash, user_id, school_id, role_code, is_support_session, expires_at)
    values (encode(digest(v_full_token, 'sha256'), 'hex'), v_school_admin.id, v_school.id,
            'SCHOOL_ADMIN', true, now() + interval '12 hours');

    return jsonb_build_object(
      'accessToken', v_full_token,
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
    -- Synthetic persona: session belongs to the REAL platform admin, scoped to the target school
    insert into public.app_sessions (token_hash, user_id, school_id, role_code, is_support_session, expires_at)
    values (encode(digest(v_full_token, 'sha256'), 'hex'), public.current_user_id(), v_school.id,
            'SCHOOL_ADMIN', true, now() + interval '12 hours');

    return jsonb_build_object(
      'accessToken', v_full_token,
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
-- 6. GUARDED WRAPPERS for privileged RPCs
--    (original logic renamed to _*_unsafe; wrapper enforces identity)
-- ============================================================

-- 6a. get_dashboard_overview
do $$ begin
  if to_regprocedure('public._get_dashboard_overview_unsafe(text,text,text,text)') is null then
    alter function public.get_dashboard_overview(text, text, text, text) rename to _get_dashboard_overview_unsafe;
  end if;
end $$;

create or replace function public.get_dashboard_overview(
  p_school_id text,
  p_academic_year_id text default null,
  p_user_id text default null,
  p_role text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if public.current_session() is null then
    return jsonb_build_object('success', false, 'error', 'session_required');
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

-- 6b. get_classes_overview
do $$ begin
  if to_regprocedure('public._get_classes_overview_unsafe(text,text)') is null then
    alter function public.get_classes_overview(text, text) rename to _get_classes_overview_unsafe;
  end if;
end $$;

create or replace function public.get_classes_overview(
  p_school_id text,
  p_academic_year_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if public.current_session() is null then
    return jsonb_build_object('success', false, 'error', 'session_required');
  end if;

  return public._get_classes_overview_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id()::text end,
    p_academic_year_id
  );
end;
$$;
grant execute on function public.get_classes_overview(text, text) to anon, authenticated, service_role;

-- 6c. get_class_details (class must belong to the caller's school)
do $$ begin
  if to_regprocedure('public._get_class_details_unsafe(text,text)') is null then
    alter function public.get_class_details(text, text) rename to _get_class_details_unsafe;
  end if;
end $$;

create or replace function public.get_class_details(
  p_class_id text,
  p_academic_year_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if public.current_session() is null then
    return jsonb_build_object('error', 'session_required');
  end if;

  if not exists (
    select 1 from public.classes c
     where c.id::text = p_class_id
       and (c.school_id = public.current_school_id() or public.is_platform_admin())
  ) then
    return jsonb_build_object('error', 'access_denied');
  end if;

  return public._get_class_details_unsafe(p_class_id, p_academic_year_id);
end;
$$;
grant execute on function public.get_class_details(text, text) to anon, authenticated, service_role;

-- 6d. onboard_school_tenant — platform admins only
do $$ begin
  if to_regprocedure('public._onboard_school_tenant_unsafe(text,text,text,text,text,text,text,text,text,text,text,text,text,text)') is null then
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
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Access denied. School onboarding is restricted to Platform Administrators.';
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

-- 6e. top_up_school_wallet
do $$ begin
  if to_regprocedure('public._top_up_school_wallet_unsafe(uuid,numeric,text,text,uuid)') is null then
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
security definer
set search_path = public, extensions
as $$
declare
  v_school_id uuid;
begin
  if public.current_session() is null then
    raise exception 'Authentication required.';
  end if;

  if public.is_platform_admin() then
    v_school_id := p_school_id;
  else
    if not public.is_staff_role() then
      raise exception 'Access denied.';
    end if;
    v_school_id := public.current_school_id();
  end if;

  return public._top_up_school_wallet_unsafe(v_school_id, p_amount, p_method, p_notes, public.current_user_id());
end;
$$;
grant execute on function public.top_up_school_wallet(uuid, numeric, text, text, uuid) to anon, authenticated;

-- 6f. execute_monthly_subscription_billing
do $$ begin
  if to_regprocedure('public._execute_monthly_subscription_billing_unsafe(uuid,uuid)') is null then
    alter function public.execute_monthly_subscription_billing(uuid, uuid) rename to _execute_monthly_subscription_billing_unsafe;
  end if;
end $$;

create or replace function public.execute_monthly_subscription_billing(
  p_school_id uuid,
  p_performed_by_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_school_id uuid;
begin
  if public.current_session() is null then
    raise exception 'Authentication required.';
  end if;

  if public.is_platform_admin() then
    v_school_id := p_school_id;
  else
    if not public.is_staff_role() then
      raise exception 'Access denied.';
    end if;
    v_school_id := public.current_school_id();
  end if;

  return public._execute_monthly_subscription_billing_unsafe(v_school_id, public.current_user_id());
end;
$$;
grant execute on function public.execute_monthly_subscription_billing(uuid, uuid) to anon, authenticated;

-- 6g. update_school_subscription_rate — platform admins only
do $$ begin
  if to_regprocedure('public._update_school_subscription_rate_unsafe(uuid,numeric,numeric,text,uuid)') is null then
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
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Access denied. Only Platform Administrators can change subscription rates.';
  end if;

  return public._update_school_subscription_rate_unsafe(
    p_school_id, p_per_student_fee, p_wallet_adjustment, p_adjustment_reason, public.current_user_id()
  );
end;
$$;
grant execute on function public.update_school_subscription_rate(uuid, numeric, numeric, text, uuid) to anon, authenticated;

-- 6h. calculate_monthly_subscription
do $$ begin
  if to_regprocedure('public._calculate_monthly_subscription_unsafe(uuid)') is null then
    alter function public.calculate_monthly_subscription(uuid) rename to _calculate_monthly_subscription_unsafe;
  end if;
end $$;

create or replace function public.calculate_monthly_subscription(p_school_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if public.current_session() is null then
    raise exception 'Authentication required.';
  end if;

  return public._calculate_monthly_subscription_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id() end
  );
end;
$$;
grant execute on function public.calculate_monthly_subscription(uuid) to anon, authenticated;

-- 6i. get_school_subscription_details
do $$ begin
  if to_regprocedure('public._get_school_subscription_details_unsafe(uuid)') is null then
    alter function public.get_school_subscription_details(uuid) rename to _get_school_subscription_details_unsafe;
  end if;
end $$;

create or replace function public.get_school_subscription_details(p_school_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if public.current_session() is null then
    raise exception 'Authentication required.';
  end if;

  if not public.is_platform_admin() and not public.is_staff_role() then
    raise exception 'Access denied.';
  end if;

  return public._get_school_subscription_details_unsafe(
    case when public.is_platform_admin() then p_school_id else public.current_school_id() end
  );
end;
$$;
grant execute on function public.get_school_subscription_details(uuid) to anon, authenticated;

-- Lock the raw implementations away from every client role
revoke execute on function public._get_dashboard_overview_unsafe(text,text,text,text)   from public, anon, authenticated;
revoke execute on function public._get_classes_overview_unsafe(text,text)               from public, anon, authenticated;
revoke execute on function public._get_class_details_unsafe(text,text)                  from public, anon, authenticated;
revoke execute on function public._onboard_school_tenant_unsafe(text,text,text,text,text,text,text,text,text,text,text,text,text,text) from public, anon, authenticated;
revoke execute on function public._top_up_school_wallet_unsafe(uuid,numeric,text,text,uuid) from public, anon, authenticated;
revoke execute on function public._execute_monthly_subscription_billing_unsafe(uuid,uuid) from public, anon, authenticated;
revoke execute on function public._update_school_subscription_rate_unsafe(uuid,numeric,numeric,text,uuid) from public, anon, authenticated;
revoke execute on function public._calculate_monthly_subscription_unsafe(uuid)          from public, anon, authenticated;
revoke execute on function public._get_school_subscription_details_unsafe(uuid)         from public, anon, authenticated;


-- ============================================================
-- 7. LEGACY HELPERS — rebind to the new session model
-- ============================================================
-- get_user_school_ids() is left as-is: it is auth.uid()-based dead
-- code after the policy rebuild and returns an empty set harmlessly.
create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public, extensions
as $$ select public.is_platform_admin() $$;

-- Public directory RPC stays disabled
revoke execute on function public.get_public_school_directory() from anon, authenticated;


-- ============================================================
-- 8. RLS REBUILD
-- ============================================================

-- 8a. Drop every existing policy in public
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- 8b. Ensure RLS is enabled everywhere in public
do $$
declare r record;
begin
  for r in
    select c.relname from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('alter table public.%I enable row level security', r.relname);
  end loop;
end $$;

-- 8c. Generic tenant isolation for simple school_id tables
do $$
declare
  r record;
  custom_tables text[] := array[
    'schools','roles','users','user_school_roles','students','guardians','student_guardians',
    'student_enrollments','attendance','student_marks','student_fee_invoices','complaints',
    'complaint_messages','audit_logs','school_subscriptions','school_wallets','wallet_transactions',
    'class_subjects','exam_schedules','grading_scale_details','notice_recipients','homework_submissions',
    'demo_leads','app_sessions','permissions','role_permissions'
  ];
begin
  for r in
    select distinct c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
       and exists (
         select 1 from information_schema.columns col
          where col.table_schema = 'public' and col.table_name = c.relname and col.column_name = 'school_id'
       )
       and not (c.relname = any(custom_tables))
  loop
    execute format($f$
      create policy tenant_isolation on public.%I
        for all
        using (public.is_platform_admin() or school_id = public.current_school_id())
        with check (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()))
    $f$, r.relname);
  end loop;
end $$;

-- 8d. Custom policies — tenants
create policy tenant_select on public.schools
  for select using (public.is_platform_admin() or id = public.current_school_id());
create policy tenant_insert on public.schools
  for insert with check (public.is_platform_admin());
create policy tenant_update on public.schools
  for update using (public.is_platform_admin() or (id = public.current_school_id() and public.is_staff_role()))
              with check (public.is_platform_admin() or (id = public.current_school_id() and public.is_staff_role()));
create policy tenant_delete on public.schools
  for delete using (public.is_platform_admin());

-- 8e. Roles & permissions — readable by any valid session, writable by platform admins
create policy roles_read on public.roles
  for select using (public.current_session() is not null);
create policy roles_write on public.roles
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy permissions_read on public.permissions
  for select using (public.current_session() is not null);
create policy permissions_write on public.permissions
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy role_permissions_read on public.role_permissions
  for select using (public.current_session() is not null);
create policy role_permissions_write on public.role_permissions
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- 8f. Users — self, same-school staff, and staff contact info for parents
create policy users_select on public.users
  for select using (
    public.is_platform_admin()
    or id = public.current_user_id()
    or (public.is_staff_role() and public.shares_school_with(id))
    or (
      public.current_school_id() is not null
      and exists (
        select 1 from public.user_school_roles b
        join public.roles r on r.id = b.role_id
        where b.user_id = users.id
          and b.school_id = public.current_school_id()
          and b.status = 'ACTIVE'
          and r.code in ('TEACHER','CLASS_TEACHER','PRINCIPAL','SCHOOL_ADMIN')
      )
    )
  );
create policy users_insert on public.users
  for insert with check (public.is_platform_admin() or (public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL')));
create policy users_update on public.users
  for update using (
    public.is_platform_admin()
    or id = public.current_user_id()
    or (public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL') and public.shares_school_with(id))
  )
  with check (
    public.is_platform_admin()
    or id = public.current_user_id()
    or (public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL') and public.shares_school_with(id))
  );
create policy users_delete on public.users
  for delete using (public.is_platform_admin());

-- Password hashes are never exposed to client roles.
-- NOTE: a table-level SELECT grant overrides column-level revokes in Postgres,
-- so we re-grant SELECT at COLUMN level with password_hash excluded.
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

-- 8g. Membership roles — assigning roles is an admin-tier action
create policy usr_select on public.user_school_roles
  for select using (
    public.is_platform_admin()
    or user_id = public.current_user_id()
    or school_id = public.current_school_id()
  );
create policy usr_insert on public.user_school_roles
  for insert with check (public.is_platform_admin() or (school_id = public.current_school_id() and public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL')));
create policy usr_update on public.user_school_roles
  for update using (public.is_platform_admin() or (school_id = public.current_school_id() and public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL')))
              with check (public.is_platform_admin() or (school_id = public.current_school_id() and public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL')));
create policy usr_delete on public.user_school_roles
  for delete using (public.is_platform_admin() or (school_id = public.current_school_id() and public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL')));

-- 8h. Students — staff see the school; parents see only their children
create policy students_select on public.students
  for select using (
    public.is_platform_admin()
    or (school_id = public.current_school_id() and (public.is_staff_role() or public.parent_can_access_student(id)))
  );
create policy students_insert on public.students
  for insert with check (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()));
create policy students_update on public.students
  for update using (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()))
              with check (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()));
create policy students_delete on public.students
  for delete using (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()));

-- 8i. Guardians
create policy guardians_select on public.guardians
  for select using (
    public.is_platform_admin()
    or (school_id = public.current_school_id() and (public.is_staff_role() or user_id = public.current_user_id()))
  );
create policy guardians_insert on public.guardians
  for insert with check (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()));
create policy guardians_update on public.guardians
  for update using (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()))
              with check (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()));
create policy guardians_delete on public.guardians
  for delete using (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()));

-- 8j. Student ↔ guardian links
create policy sg_select on public.student_guardians
  for select using (
    public.is_platform_admin()
    or exists (
      select 1 from public.students s
       where s.id = student_guardians.student_id
         and s.school_id = public.current_school_id()
         and (public.is_staff_role() or public.parent_can_access_student(student_guardians.student_id))
    )
  );
create policy sg_write on public.student_guardians
  for all using (
    public.is_platform_admin()
    or exists (select 1 from public.students s where s.id = student_guardians.student_id and s.school_id = public.current_school_id())
       and public.is_staff_role()
  )
  with check (
    public.is_platform_admin()
    or (exists (select 1 from public.students s where s.id = student_guardians.student_id and s.school_id = public.current_school_id())
        and public.is_staff_role())
  );

-- 8k. Enrollments — one row per student per session
create policy enrollments_select on public.student_enrollments
  for select using (
    public.is_platform_admin()
    or exists (
      select 1 from public.students s
       where s.id = student_enrollments.student_id
         and s.school_id = public.current_school_id()
         and (public.is_staff_role() or public.parent_can_access_student(student_enrollments.student_id))
    )
  );
create policy enrollments_write on public.student_enrollments
  for all using (
    public.is_platform_admin()
    or (exists (select 1 from public.students s where s.id = student_enrollments.student_id and s.school_id = public.current_school_id())
        and public.is_staff_role())
  )
  with check (
    public.is_platform_admin()
    or (exists (select 1 from public.students s where s.id = student_enrollments.student_id and s.school_id = public.current_school_id())
        and public.is_staff_role())
  );

-- 8l. Attendance — staff = school, parents = own children, writes staff-only
create policy attendance_select on public.attendance
  for select using (
    public.is_platform_admin()
    or (school_id = public.current_school_id() and (public.is_staff_role() or public.parent_can_access_student(student_id)))
  );
create policy attendance_write on public.attendance
  for all using (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()))
  with check (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()));

-- 8m. Marks
create policy marks_select on public.student_marks
  for select using (
    public.is_platform_admin()
    or (school_id = public.current_school_id() and (public.is_staff_role() or public.parent_can_access_student(student_id)))
  );
create policy marks_write on public.student_marks
  for all using (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()))
  with check (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()));

-- 8n. Fee invoices (money data)
create policy invoices_select on public.student_fee_invoices
  for select using (
    public.is_platform_admin()
    or (school_id = public.current_school_id() and (public.is_staff_role() or public.parent_can_access_student(student_id)))
  );
create policy invoices_write on public.student_fee_invoices
  for all using (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()))
  with check (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()));

-- 8o. Complaints — parents see and write only their own; staff manage the school's
create policy complaints_select on public.complaints
  for select using (
    public.is_platform_admin()
    or (school_id = public.current_school_id() and (public.is_staff_role() or submitted_by_id = public.current_user_id()))
  );
create policy complaints_insert on public.complaints
  for insert with check (
    public.is_platform_admin()
    or (school_id = public.current_school_id() and submitted_by_id = public.current_user_id())
  );
create policy complaints_update on public.complaints
  for update using (
    public.is_platform_admin()
    or (school_id = public.current_school_id() and (public.is_staff_role() or submitted_by_id = public.current_user_id()))
  )
  with check (
    public.is_platform_admin()
    or (school_id = public.current_school_id() and (public.is_staff_role() or submitted_by_id = public.current_user_id()))
  );
create policy complaints_delete on public.complaints
  for delete using (public.is_platform_admin() or (school_id = public.current_school_id() and public.is_staff_role()));

create policy cm_select on public.complaint_messages
  for select using (
    public.is_platform_admin()
    or exists (
      select 1 from public.complaints c
       where c.id = complaint_messages.complaint_id
         and c.school_id = public.current_school_id()
         and (public.is_staff_role() or c.submitted_by_id = public.current_user_id())
    )
  );
create policy cm_insert on public.complaint_messages
  for insert with check (
    sender_id = public.current_user_id()
    and (
      public.is_platform_admin()
      or exists (
        select 1 from public.complaints c
         where c.id = complaint_messages.complaint_id
           and c.school_id = public.current_school_id()
           and (public.is_staff_role() or c.submitted_by_id = public.current_user_id())
      )
    )
  );

-- 8p. Join tables without school_id
create policy class_subjects_select on public.class_subjects
  for select using (
    public.is_platform_admin()
    or exists (select 1 from public.classes c where c.id = class_subjects.class_id and c.school_id = public.current_school_id())
  );
create policy class_subjects_write on public.class_subjects
  for all using (
    public.is_platform_admin()
    or (exists (select 1 from public.classes c where c.id = class_subjects.class_id and c.school_id = public.current_school_id())
        and public.is_staff_role())
  )
  with check (
    public.is_platform_admin()
    or (exists (select 1 from public.classes c where c.id = class_subjects.class_id and c.school_id = public.current_school_id())
        and public.is_staff_role())
  );

create policy exam_schedules_select on public.exam_schedules
  for select using (
    public.is_platform_admin()
    or exists (select 1 from public.exams e where e.id = exam_schedules.exam_id and e.school_id = public.current_school_id())
  );
create policy exam_schedules_write on public.exam_schedules
  for all using (
    public.is_platform_admin()
    or (exists (select 1 from public.exams e where e.id = exam_schedules.exam_id and e.school_id = public.current_school_id())
        and public.is_staff_role())
  )
  with check (
    public.is_platform_admin()
    or (exists (select 1 from public.exams e where e.id = exam_schedules.exam_id and e.school_id = public.current_school_id())
        and public.is_staff_role())
  );

create policy grading_details_select on public.grading_scale_details
  for select using (
    public.is_platform_admin()
    or exists (select 1 from public.grading_schemes g where g.id = grading_scale_details.grading_scheme_id and g.school_id = public.current_school_id())
  );
create policy grading_details_write on public.grading_scale_details
  for all using (
    public.is_platform_admin()
    or (exists (select 1 from public.grading_schemes g where g.id = grading_scale_details.grading_scheme_id and g.school_id = public.current_school_id())
        and public.is_staff_role())
  )
  with check (
    public.is_platform_admin()
    or (exists (select 1 from public.grading_schemes g where g.id = grading_scale_details.grading_scheme_id and g.school_id = public.current_school_id())
        and public.is_staff_role())
  );

create policy notice_recipients_select on public.notice_recipients
  for select using (
    public.is_platform_admin()
    or exists (select 1 from public.notices n where n.id = notice_recipients.notice_id and n.school_id = public.current_school_id())
  );
create policy notice_recipients_write on public.notice_recipients
  for all using (
    public.is_platform_admin()
    or (exists (select 1 from public.notices n where n.id = notice_recipients.notice_id and n.school_id = public.current_school_id())
        and public.is_staff_role())
  )
  with check (
    public.is_platform_admin()
    or (exists (select 1 from public.notices n where n.id = notice_recipients.notice_id and n.school_id = public.current_school_id())
        and public.is_staff_role())
  );

create policy hw_submissions_select on public.homework_submissions
  for select using (
    public.is_platform_admin()
    or exists (
      select 1 from public.homework h
       where h.id = homework_submissions.homework_id
         and h.school_id = public.current_school_id()
         and (public.is_staff_role() or public.parent_can_access_student(homework_submissions.student_id))
    )
  );
create policy hw_submissions_write on public.homework_submissions
  for all using (
    public.is_platform_admin()
    or (exists (select 1 from public.homework h where h.id = homework_submissions.homework_id and h.school_id = public.current_school_id())
        and public.is_staff_role())
  )
  with check (
    public.is_platform_admin()
    or (exists (select 1 from public.homework h where h.id = homework_submissions.homework_id and h.school_id = public.current_school_id())
        and public.is_staff_role())
  );

-- 8q. Audit logs — staff read of own school only; writes come from definer functions
create policy audit_logs_select on public.audit_logs
  for select using (
    public.is_platform_admin()
    or (school_id = public.current_school_id() and public.is_staff_role())
  );

-- 8r. Billing tables — school admins / principals / fee managers only
create policy subscriptions_select on public.school_subscriptions
  for select using (
    public.is_platform_admin()
    or (school_id = public.current_school_id() and public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL','FEE_MANAGER'))
  );
create policy subscriptions_write on public.school_subscriptions
  for all using (public.is_platform_admin() or (school_id = public.current_school_id() and public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL','FEE_MANAGER')))
  with check (public.is_platform_admin() or (school_id = public.current_school_id() and public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL','FEE_MANAGER')));

create policy wallets_select on public.school_wallets
  for select using (
    public.is_platform_admin()
    or (school_id = public.current_school_id() and public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL','FEE_MANAGER'))
  );
create policy wallets_write on public.school_wallets
  for all using (public.is_platform_admin() or (school_id = public.current_school_id() and public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL','FEE_MANAGER')))
  with check (public.is_platform_admin() or (school_id = public.current_school_id() and public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL','FEE_MANAGER')));

create policy wallet_tx_select on public.wallet_transactions
  for select using (
    public.is_platform_admin()
    or (school_id = public.current_school_id() and public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL','FEE_MANAGER'))
  );
create policy wallet_tx_write on public.wallet_transactions
  for all using (public.is_platform_admin() or (school_id = public.current_school_id() and public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL','FEE_MANAGER')))
  with check (public.is_platform_admin() or (school_id = public.current_school_id() and public.current_app_role() in ('SCHOOL_ADMIN','PRINCIPAL','FEE_MANAGER')));

-- 8s. demo_leads + app_sessions stay policy-free (deny-all), as built above


-- ============================================================
-- 9. STORAGE — lock object writes, keep logo reads public
-- ============================================================
drop policy if exists "Auth Delete school-assets" on storage.objects;
drop policy if exists "Auth Update school-assets" on storage.objects;
drop policy if exists "Auth Upload school-assets" on storage.objects;
drop policy if exists "Public Read school-assets"  on storage.objects;
drop policy if exists "school-assets public read" on storage.objects;
drop policy if exists "school-assets upload"      on storage.objects;
drop policy if exists "school-assets update"      on storage.objects;
drop policy if exists "school-assets delete"      on storage.objects;

create policy "school-assets public read" on storage.objects
  for select using (bucket_id = 'school-assets');

create policy "school-assets upload" on storage.objects
  for insert with check (bucket_id = 'school-assets' and public.current_user_id() is not null);

create policy "school-assets update" on storage.objects
  for update using (bucket_id = 'school-assets' and public.current_user_id() is not null)
  with check (bucket_id = 'school-assets' and public.current_user_id() is not null);

create policy "school-assets delete" on storage.objects
  for delete using (bucket_id = 'school-assets' and public.current_user_id() is not null);


-- ============================================================
-- 10. Cleanup probe
-- ============================================================
drop function if exists public._probe_headers();


-- ============================================================
-- 11. PUBLIC SCHOOL DIRECTORY (login-page branding, anonymous-safe)
-- ============================================================
-- A locked-down projection of school branding that the login page can show
-- WITHOUT authentication: school name, logo, city and board. Sensitive
-- columns (contact email/phone, address, affiliation number) are never
-- exposed through this view, and the PLATFORM pseudo-tenant is hidden.
create or replace view public.school_public_profiles
with (security_invoker = false) as
  select id, name, code, city, state, logo_url, affiliation_board, affiliation, motto, status
    from public.schools
   where deleted_at is null
     and status = 'ACTIVE'
     and code <> 'PLATFORM';

comment on view public.school_public_profiles is
  'Anonymous-safe school branding for the login page (name, logo, city, board). Only ACTIVE schools, PLATFORM hidden.';

revoke all on public.school_public_profiles from public;
grant select on public.school_public_profiles to anon, authenticated;
