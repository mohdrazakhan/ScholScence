-- ==============================================================================
-- SchoolSense — Platform CRM, Lead Diary & Revenue Analytics Engine
-- ==============================================================================
-- Extends demo_leads into a complete B2B Sales Diary & Marketing CRM.
-- Provides RPCs for Super Admin / Platform Developer to:
--   1. Track school leads, key contacts, requirements, meetings & call logs.
--   2. Manage marketing follow-up timelines and conversion to active schools.
--   3. Aggregate cross-tenant monthly revenue analytics and historical billing.
-- ==============================================================================

set search_path = public, extensions;

-- 1. Extend demo_leads table with CRM columns if not already present
alter table public.demo_leads add column if not exists contact_person text;
alter table public.demo_leads add column if not exists contact_designation text;
alter table public.demo_leads add column if not exists key_connections text;
alter table public.demo_leads add column if not exists requirements text;
alter table public.demo_leads add column if not exists current_erp text;
alter table public.demo_leads add column if not exists estimated_students integer default 0;
alter table public.demo_leads add column if not exists target_rate numeric(10, 2) default 20.00;
alter table public.demo_leads add column if not exists next_followup_date timestamptz;
alter table public.demo_leads add column if not exists target_deadline timestamptz;
alter table public.demo_leads add column if not exists activities jsonb default '[]'::jsonb;
alter table public.demo_leads add column if not exists converted_school_id uuid references public.schools(id) on delete set null;

-- Ensure status check accepts standard CRM workflow
alter table public.demo_leads drop constraint if exists chk_demo_leads_status;
alter table public.demo_leads add constraint chk_demo_leads_status
  check (status in ('NEW', 'CONTACTED', 'MEETING_SCHEDULED', 'DEMO_SCHEDULED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST'));

-- Indexes for lightning fast queries
create index if not exists idx_demo_leads_followup on public.demo_leads(next_followup_date);
create index if not exists idx_demo_leads_status on public.demo_leads(status);
create index if not exists idx_demo_leads_created on public.demo_leads(created_at desc);

-- ==============================================================================
-- RPC 1: get_platform_crm_leads()
-- Strictly platform-admin secured. Returns leads sorted by follow-up priority.
-- ==============================================================================
create or replace function public.get_platform_crm_leads()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_leads jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Access Denied: Platform Administrator privilege required'
      using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', l.id,
        'schoolName', coalesce(l.school_name, 'Untitled Prospect School'),
        'fullName', l.full_name,
        'phone', l.phone,
        'email', l.email,
        'role', l.role,
        'city', l.city,
        'status', l.status,
        'notes', l.notes,
        'contactPerson', coalesce(l.contact_person, l.full_name),
        'contactDesignation', coalesce(l.contact_designation, l.role, 'Principal / Administrator'),
        'keyConnections', l.key_connections,
        'requirements', l.requirements,
        'currentErp', l.current_erp,
        'estimatedStudents', coalesce(l.estimated_students, 0),
        'targetRate', coalesce(l.target_rate, 20.00),
        'nextFollowupDate', l.next_followup_date,
        'targetDeadline', l.target_deadline,
        'activities', coalesce(l.activities, '[]'::jsonb),
        'convertedSchoolId', l.converted_school_id,
        'source', l.source,
        'createdAt', l.created_at,
        'updatedAt', l.updated_at
      ) order by
        case
          when l.status in ('NEW', 'CONTACTED', 'MEETING_SCHEDULED', 'PROPOSAL_SENT', 'NEGOTIATION') then 0
          when l.status = 'WON' then 1
          else 2
        end,
        l.next_followup_date nulls last,
        l.created_at desc
    ),
    '[]'::jsonb
  ) into v_leads
  from public.demo_leads l;

  return v_leads;
end;
$$;

grant execute on function public.get_platform_crm_leads() to authenticated;


-- ==============================================================================
-- RPC 2: save_platform_crm_lead()
-- Inserts or updates a lead with contact connections and requirements diary.
-- ==============================================================================
create or replace function public.save_platform_crm_lead(p_lead jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_lead_id uuid;
  v_id text;
  v_status text;
begin
  if not public.is_platform_admin() then
    raise exception 'Access Denied: Platform Administrator privilege required'
      using errcode = '42501';
  end if;

  v_id := p_lead->>'id';
  v_status := coalesce(nullif(p_lead->>'status', ''), 'NEW');

  if v_id is not null and v_id != '' then
    -- Update existing lead
    update public.demo_leads
    set
      school_name        = coalesce(nullif(btrim(p_lead->>'schoolName'), ''), school_name),
      full_name          = coalesce(nullif(btrim(p_lead->>'fullName'), ''), full_name),
      phone              = coalesce(nullif(btrim(p_lead->>'phone'), ''), phone),
      email              = nullif(btrim(coalesce(p_lead->>'email', '')), ''),
      role               = nullif(btrim(coalesce(p_lead->>'role', '')), ''),
      city               = nullif(btrim(coalesce(p_lead->>'city', '')), ''),
      status             = v_status,
      notes              = nullif(btrim(coalesce(p_lead->>'notes', '')), ''),
      contact_person     = nullif(btrim(coalesce(p_lead->>'contactPerson', '')), ''),
      contact_designation= nullif(btrim(coalesce(p_lead->>'contactDesignation', '')), ''),
      key_connections    = nullif(btrim(coalesce(p_lead->>'keyConnections', '')), ''),
      requirements       = nullif(btrim(coalesce(p_lead->>'requirements', '')), ''),
      current_erp        = nullif(btrim(coalesce(p_lead->>'currentErp', '')), ''),
      estimated_students = coalesce((p_lead->>'estimatedStudents')::integer, estimated_students, 0),
      target_rate        = coalesce((p_lead->>'targetRate')::numeric, target_rate, 20.00),
      next_followup_date = case when p_lead->>'nextFollowupDate' is not null and p_lead->>'nextFollowupDate' != '' then (p_lead->>'nextFollowupDate')::timestamptz else null end,
      target_deadline    = case when p_lead->>'targetDeadline' is not null and p_lead->>'targetDeadline' != '' then (p_lead->>'targetDeadline')::timestamptz else null end,
      activities         = coalesce(p_lead->'activities', activities, '[]'::jsonb),
      updated_at         = now()
    where id = v_id::uuid
    returning id into v_lead_id;
  else
    -- Insert new prospect lead
    insert into public.demo_leads (
      school_name,
      full_name,
      phone,
      email,
      role,
      city,
      status,
      notes,
      contact_person,
      contact_designation,
      key_connections,
      requirements,
      current_erp,
      estimated_students,
      target_rate,
      next_followup_date,
      target_deadline,
      activities,
      source
    ) values (
      coalesce(nullif(btrim(p_lead->>'schoolName'), ''), 'New Prospect Campus'),
      coalesce(nullif(btrim(p_lead->>'fullName'), ''), nullif(btrim(p_lead->>'contactPerson'), ''), 'Administrator'),
      coalesce(nullif(btrim(p_lead->>'phone'), ''), '9999999999'),
      nullif(btrim(coalesce(p_lead->>'email', '')), ''),
      nullif(btrim(coalesce(p_lead->>'role', '')), ''),
      nullif(btrim(coalesce(p_lead->>'city', '')), ''),
      v_status,
      nullif(btrim(coalesce(p_lead->>'notes', '')), ''),
      nullif(btrim(coalesce(p_lead->>'contactPerson', '')), ''),
      nullif(btrim(coalesce(p_lead->>'contactDesignation', '')), ''),
      nullif(btrim(coalesce(p_lead->>'keyConnections', '')), ''),
      nullif(btrim(coalesce(p_lead->>'requirements', '')), ''),
      nullif(btrim(coalesce(p_lead->>'currentErp', '')), ''),
      coalesce((p_lead->>'estimatedStudents')::integer, 0),
      coalesce((p_lead->>'targetRate')::numeric, 20.00),
      case when p_lead->>'nextFollowupDate' is not null and p_lead->>'nextFollowupDate' != '' then (p_lead->>'nextFollowupDate')::timestamptz else null end,
      case when p_lead->>'targetDeadline' is not null and p_lead->>'targetDeadline' != '' then (p_lead->>'targetDeadline')::timestamptz else null end,
      coalesce(p_lead->'activities', '[]'::jsonb),
      coalesce(nullif(btrim(p_lead->>'source'), ''), 'super_admin_manual')
    )
    returning id into v_lead_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'leadId', v_lead_id,
    'message', 'Lead record saved successfully'
  );
end;
$$;

grant execute on function public.save_platform_crm_lead(jsonb) to authenticated;


-- ==============================================================================
-- RPC 3: log_platform_lead_activity()
-- Appends a call log, meeting schedule, conversation note, or requirement.
-- ==============================================================================
create or replace function public.log_platform_lead_activity(
  p_lead_id   uuid,
  p_activity  jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_activity_item jsonb;
  v_current_activities jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Access Denied: Platform Administrator privilege required'
      using errcode = '42501';
  end if;

  select coalesce(activities, '[]'::jsonb)
    into v_current_activities
    from public.demo_leads
   where id = p_lead_id;

  if not found then
    raise exception 'Lead not found with ID %', p_lead_id;
  end if;

  v_activity_item := jsonb_build_object(
    'id', gen_random_uuid(),
    'type', coalesce(p_activity->>'type', 'NOTE'), -- 'CALL', 'MEETING', 'NOTE', 'REQUIREMENT'
    'title', coalesce(p_activity->>'title', 'General Activity Note'),
    'description', coalesce(p_activity->>'description', ''),
    'outcome', p_activity->>'outcome',
    'scheduledAt', p_activity->>'scheduledAt',
    'loggedAt', now(),
    'loggedBy', coalesce(p_activity->>'loggedBy', 'Platform Admin')
  );

  update public.demo_leads
     set activities = v_current_activities || jsonb_build_array(v_activity_item),
         next_followup_date = case
           when p_activity->>'nextFollowupDate' is not null and p_activity->>'nextFollowupDate' != ''
           then (p_activity->>'nextFollowupDate')::timestamptz
           else next_followup_date
         end,
         status = case
           when p_activity->>'newStatus' is not null and p_activity->>'newStatus' != ''
           then p_activity->>'newStatus'
           else status
         end,
         updated_at = now()
   where id = p_lead_id;

  return jsonb_build_object(
    'success', true,
    'activity', v_activity_item,
    'message', 'Activity successfully logged in diary'
  );
end;
$$;

grant execute on function public.log_platform_lead_activity(uuid, jsonb) to authenticated;


-- ==============================================================================
-- RPC 4: get_platform_revenue_analytics()
-- Calculates collective MRR, monthly billing history, and school rankings.
-- ==============================================================================
create or replace function public.get_platform_revenue_analytics()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_total_schools integer;
  v_active_schools integer;
  v_total_students integer;
  v_total_mrr numeric;
  v_total_arr numeric;
  v_avg_per_student_fee numeric;
  v_total_wallet_balance numeric;
  v_schools_breakdown jsonb;
  v_monthly_history jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Access Denied: Platform Administrator privilege required'
      using errcode = '42501';
  end if;

  -- 1. Aggregate counts
  select count(*), count(*) filter (where status = 'ACTIVE')
    into v_total_schools, v_active_schools
    from public.schools
   where code != 'PLATFORM';

  -- Active students across all active schools
  select count(*)
    into v_total_students
    from public.students st
    join public.schools sc on sc.id = st.school_id
   where sc.code != 'PLATFORM'
     and st.status = 'ACTIVE';

  -- 2. School-by-school MRR & wallet breakdown
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'schoolId', sc.id,
        'schoolName', sc.name,
        'schoolCode', sc.code,
        'city', sc.city,
        'status', sc.status,
        'studentCount', coalesce(stu.cnt, 0),
        'perStudentFee', coalesce(sub.per_student_fee, 20.00),
        'monthlyRevenue', coalesce(stu.cnt, 0) * coalesce(sub.per_student_fee, 20.00),
        'walletBalance', coalesce(wal.balance, 0.00),
        'walletStatus', case when coalesce(wal.balance, 0.00) < 0 then 'ARREARS' else 'HEALTHY' end
      ) order by (coalesce(stu.cnt, 0) * coalesce(sub.per_student_fee, 20.00)) desc
    ),
    '[]'::jsonb
  ) into v_schools_breakdown
  from public.schools sc
  left join (
    select school_id, count(*) as cnt
      from public.students
     where status = 'ACTIVE'
     group by school_id
  ) stu on stu.school_id = sc.id
  left join public.school_subscriptions sub on sub.school_id = sc.id
  left join public.school_wallets wal on wal.school_id = sc.id
  where sc.code != 'PLATFORM';

  -- Sum MRR
  select coalesce(sum((item->>'monthlyRevenue')::numeric), 0.00)
    into v_total_mrr
    from jsonb_array_elements(v_schools_breakdown) as item
   where item->>'status' = 'ACTIVE';

  v_total_arr := v_total_mrr * 12;

  -- Total wallet balance
  select coalesce(sum((item->>'walletBalance')::numeric), 0.00)
    into v_total_wallet_balance
    from jsonb_array_elements(v_schools_breakdown) as item;

  -- Average rate
  select coalesce(avg((item->>'perStudentFee')::numeric), 20.00)
    into v_avg_per_student_fee
    from jsonb_array_elements(v_schools_breakdown) as item;

  -- 3. Monthly revenue timeline history (past 6 months projection & ledger aggregations)
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'monthYear', to_char(d, 'Mon YYYY'),
        'monthKey', to_char(d, 'YYYY-MM'),
        'projectedRevenue', v_total_mrr,
        'billedAmount', coalesce(tx.total_billed, v_total_mrr),
        'collectedAmount', coalesce(tx.total_collected, v_total_mrr),
        'activeSchoolsCount', v_active_schools,
        'activeStudentsCount', v_total_students
      ) order by d desc
    ),
    '[]'::jsonb
  ) into v_monthly_history
  from generate_series(
    date_trunc('month', now() - interval '5 months'),
    date_trunc('month', now()),
    interval '1 month'
  ) d
  left join (
    select
      to_char(created_at, 'YYYY-MM') as month_key,
      sum(case when category = 'SUBSCRIPTION_FEE' then abs(amount) else 0 end) as total_billed,
      sum(case when transaction_type = 'CREDIT' then amount else 0 end) as total_collected
    from public.wallet_transactions
    group by to_char(created_at, 'YYYY-MM')
  ) tx on tx.month_key = to_char(d, 'YYYY-MM');

  return jsonb_build_object(
    'success', true,
    'totalSchools', v_total_schools,
    'activeSchools', v_active_schools,
    'totalStudents', v_total_students,
    'totalMrr', v_total_mrr,
    'totalArr', v_total_arr,
    'avgPerStudentFee', v_avg_per_student_fee,
    'totalWalletBalance', v_total_wallet_balance,
    'schoolsBreakdown', v_schools_breakdown,
    'monthlyHistory', v_monthly_history,
    'calculatedAt', now()
  );
end;
$$;

grant execute on function public.get_platform_revenue_analytics() to authenticated;
