-- ============================================================
-- SchoolSense — Per-school subdomains
-- ============================================================
-- Lets each school be reached at its own address, e.g.
--   dha.schoolsense.in   ->  opens straight to Delhi Heritage Academy's login
--
-- The frontend reads the subdomain from the browser's hostname (or a
-- ?school= fallback used on staging domains where wildcards are unavailable)
-- and looks the school up via the public view below.
--
-- Idempotent: safe to re-run.
-- ============================================================


-- ============================================================
-- 1. Column
-- ============================================================
alter table public.schools add column if not exists subdomain text;

comment on column public.schools.subdomain is
  'Short DNS-safe identifier for this school''s portal, e.g. "dha" for dha.schoolsense.in. Lowercase, a-z 0-9 and hyphens only. Set by platform admins.';

-- One school per subdomain (case-insensitive), ignoring NULLs
create unique index if not exists idx_schools_subdomain_unique
  on public.schools (lower(subdomain))
  where subdomain is not null;


-- ============================================================
-- 2. Normalise + validate on write
-- ============================================================
create or replace function public.trg_normalise_school_subdomain()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  v_sub text;
  v_reserved text[] := array[
    'www','app','api','admin','dashboard','login','auth','mail','email','smtp','ftp',
    'blog','legal','support','help','status','docs','cdn','static','assets','img',
    'staging','stage','uat','test','testing','dev','demo','portal','school',
    'schoolsense','platform','billing','payments','account','accounts','public'
  ];
begin
  if new.subdomain is null then
    return new;
  end if;

  -- normalise: trim, lowercase, spaces/underscores -> hyphens
  v_sub := lower(btrim(new.subdomain));
  v_sub := regexp_replace(v_sub, '[\s_]+', '-', 'g');
  v_sub := regexp_replace(v_sub, '[^a-z0-9-]', '', 'g');
  v_sub := regexp_replace(v_sub, '-{2,}', '-', 'g');
  v_sub := btrim(v_sub, '-');

  -- empty after normalisation -> treat as not set
  if v_sub = '' then
    new.subdomain := null;
    return new;
  end if;

  if length(v_sub) < 3 then
    raise exception 'Subdomain must be at least 3 characters.';
  end if;

  if length(v_sub) > 40 then
    raise exception 'Subdomain must be 40 characters or fewer.';
  end if;

  if v_sub = any(v_reserved) then
    raise exception 'The subdomain "%" is reserved. Please choose another.', v_sub;
  end if;

  new.subdomain := v_sub;
  return new;
end;
$$;

drop trigger if exists trg_schools_normalise_subdomain on public.schools;
create trigger trg_schools_normalise_subdomain
  before insert or update of subdomain on public.schools
  for each row execute function public.trg_normalise_school_subdomain();


-- ============================================================
-- 3. Expose it on the anonymous-safe public view
--    (recreated so the login page can resolve a subdomain before login)
-- ============================================================
create or replace view public.school_public_profiles
with (security_invoker = false) as
  select id, name, code, city, state, logo_url, affiliation_board, affiliation, motto, status, subdomain
    from public.schools
   where deleted_at is null
     and status = 'ACTIVE'
     and code <> 'PLATFORM';

comment on view public.school_public_profiles is
  'Anonymous-safe school branding for the login page (name, logo, city, board, subdomain). Only ACTIVE schools, PLATFORM hidden.';

revoke all on public.school_public_profiles from public;
grant select on public.school_public_profiles to anon, authenticated;


-- ============================================================
-- 4. Assign subdomains to existing schools
-- ============================================================
update public.schools set subdomain = 'dha' where code = 'DHA12' and subdomain is null;
update public.schools set subdomain = 'tps' where code = 'TPS01' and subdomain is null;


-- ============================================================
-- 5. Platform-admin RPC to set/change a school's subdomain
-- ============================================================
create or replace function public.set_school_subdomain(
  p_school_id uuid,
  p_subdomain text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_sub text;
begin
  if not public.is_platform_admin() then
    raise exception 'Access denied. Only Platform Administrators can set school subdomains.';
  end if;

  if not exists (select 1 from public.schools where id = p_school_id and deleted_at is null) then
    raise exception 'School not found.';
  end if;

  -- normalisation + reserved-word checks happen in the before-trigger
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
