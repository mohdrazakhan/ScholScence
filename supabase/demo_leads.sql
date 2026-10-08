-- ============================================================
-- SchoolSense — Website Demo Leads (public marketing site)
-- ============================================================
-- Captures "Book a Demo" submissions from the public website.
-- The table is fully locked for direct client access (RLS enabled,
-- no policies, privileges revoked). Inserts happen exclusively
-- through the SECURITY DEFINER RPC create_demo_lead(), which
-- validates input and de-duplicates repeat submissions.
-- ============================================================

create table if not exists public.demo_leads (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  phone         text not null,                -- normalised 10-digit Indian mobile
  email         text,
  school_name   text,
  role          text,                         -- School Owner / Principal / Teacher / Other
  student_count text,                         -- range bucket selected on the form
  city          text,
  message       text,
  source        text not null default 'website',  -- website | pricing | referral
  page_url      text,                         -- page the lead was captured on
  status        text not null default 'NEW',  -- NEW | CONTACTED | DEMO_SCHEDULED | WON | LOST
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.demo_leads is 'Demo requests captured from the public marketing website. Access only via create_demo_lead RPC.';

-- Lock down direct access completely
alter table public.demo_leads enable row level security;
revoke all on public.demo_leads from anon, authenticated;

-- ============================================================
-- create_demo_lead — public, validated, de-duplicated capture
-- ============================================================
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
security definer
set search_path = public
as $$
declare
  v_phone_digits text;
  v_existing_id  uuid;
  v_lead_id      uuid;
begin
  -- Name
  if p_full_name is null or length(btrim(p_full_name)) < 2 or length(btrim(p_full_name)) > 120 then
    return jsonb_build_object('success', false, 'error', 'Please enter your full name.');
  end if;

  -- Phone: accept +91 / 0 prefixed variants, normalise to 10 digits
  v_phone_digits := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(v_phone_digits) = 12 and starts_with(v_phone_digits, '91') then
    v_phone_digits := substring(v_phone_digits from 3);
  elsif length(v_phone_digits) = 11 and starts_with(v_phone_digits, '0') then
    v_phone_digits := substring(v_phone_digits from 2);
  end if;
  if v_phone_digits !~ '^[6-9][0-9]{9}$' then
    return jsonb_build_object('success', false, 'error', 'Please enter a valid 10-digit Indian mobile number.');
  end if;

  -- Email (optional, soft check)
  if p_email is not null and length(btrim(p_email)) > 0
     and btrim(p_email) !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('success', false, 'error', 'Please enter a valid email address.');
  end if;

  -- De-duplicate: same phone within 24h → treat as repeat, don't spam the table
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
