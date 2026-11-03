-- ==============================================================================
-- SchoolSense — Enterprise Fee Billing Rules, Student Ledger & Additional Charges
-- Multi-Tenant Zero-Trust Execution | Idempotent Migration
-- ==============================================================================

SET search_path = public, extensions;

-- ==============================================================================
-- 1. TABLES & EXTENSIONS
-- ==============================================================================

-- 1.1 Student Fee Preferences (Frequency & Concession Master)
CREATE TABLE IF NOT EXISTS public.student_fee_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY', -- 'MONTHLY', 'QUARTERLY', 'ANNUAL'
  annual_concession_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_student_fee_pref_year UNIQUE (school_id, student_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_student_fee_pref ON public.student_fee_preferences(school_id, student_id, academic_year_id);

ALTER TABLE public.student_fee_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_fee_preferences' AND policyname = 'student_fee_preferences_school_isolation'
  ) THEN
    CREATE POLICY "student_fee_preferences_school_isolation"
      ON public.student_fee_preferences
      FOR ALL
      USING (school_id = public.current_school_id() OR public.is_platform_admin())
      WITH CHECK (school_id = public.current_school_id() OR public.is_platform_admin());
  END IF;
END;
$$;


-- 1.2 School Fee Rules (Frequency Discounts, Due Dates & Late Fee Policies)
CREATE TABLE IF NOT EXISTS public.school_fee_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  monthly_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  quarterly_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  annual_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  due_day_of_month INT NOT NULL DEFAULT 10,
  grace_period_days INT NOT NULL DEFAULT 5,
  enable_late_fee BOOLEAN NOT NULL DEFAULT FALSE,
  late_fee_type VARCHAR(20) NOT NULL DEFAULT 'FLAT', -- 'FLAT', 'DAILY'
  late_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_school_fee_rules_session UNIQUE (school_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_school_fee_rules ON public.school_fee_rules(school_id, academic_year_id);

ALTER TABLE public.school_fee_rules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'school_fee_rules' AND policyname = 'school_fee_rules_school_isolation'
  ) THEN
    CREATE POLICY "school_fee_rules_school_isolation"
      ON public.school_fee_rules
      FOR ALL
      USING (school_id = public.current_school_id() OR public.is_platform_admin())
      WITH CHECK (school_id = public.current_school_id() OR public.is_platform_admin());
  END IF;
END;
$$;


-- 1.3 Student Fee Additional Charges (Admission, Exam, Annual, Fine/Penalty, Other)
CREATE TABLE IF NOT EXISTS public.student_fee_additional_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  charge_type VARCHAR(50) NOT NULL DEFAULT 'OTHER', -- 'ADMISSION', 'FINE_PENALTY', 'EXAM', 'ANNUAL', 'OTHER'
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  description TEXT NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PAID'
  invoice_id UUID REFERENCES public.student_fee_invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_student_fee_charges ON public.student_fee_additional_charges(school_id, student_id, academic_year_id);

ALTER TABLE public.student_fee_additional_charges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_fee_additional_charges' AND policyname = 'student_fee_charges_school_isolation'
  ) THEN
    CREATE POLICY "student_fee_charges_school_isolation"
      ON public.student_fee_additional_charges
      FOR ALL
      USING (school_id = public.current_school_id() OR public.is_platform_admin())
      WITH CHECK (school_id = public.current_school_id() OR public.is_platform_admin());
  END IF;
END;
$$;


-- ==============================================================================
-- 2. PUBLIC SECURE RPCS (ZERO-TRUST, SECURITY DEFINER, search_path PINNED)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 2.1 UPDATE STUDENT FEE PREFERENCE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_student_fee_preference(
  p_student_id UUID,
  p_frequency VARCHAR,
  p_annual_concession_pct NUMERIC DEFAULT 0.00,
  p_notes TEXT DEFAULT NULL,
  p_academic_year_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id UUID;
  v_year RECORD;
  v_freq VARCHAR := UPPER(TRIM(COALESCE(p_frequency, 'MONTHLY')));
  v_concession NUMERIC(5, 2) := GREATEST(0.00, LEAST(100.00, COALESCE(p_annual_concession_pct, 0.00)));
  v_rec RECORD;
BEGIN
  IF public.current_session() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required', 'message', 'Valid school session required');
  END IF;

  v_school_id := public.current_school_id();
  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Tenant context missing');
  END IF;

  IF v_freq NOT IN ('MONTHLY', 'QUARTERLY', 'ANNUAL') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_frequency', 'message', 'Frequency must be MONTHLY, QUARTERLY, or ANNUAL');
  END IF;

  -- Resolve Academic Year
  SELECT id, name INTO v_year
    FROM public.academic_years
   WHERE school_id = v_school_id
     AND (p_academic_year_id IS NULL AND is_current = TRUE OR id = p_academic_year_id)
   LIMIT 1;

  IF v_year.id IS NULL THEN
    SELECT id, name INTO v_year
      FROM public.academic_years
     WHERE school_id = v_school_id
     ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF v_year.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'academic_year_missing');
  END IF;

  -- Verify student belongs to tenant
  IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id AND school_id = v_school_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found');
  END IF;

  -- Upsert Preference
  INSERT INTO public.student_fee_preferences (
    school_id, student_id, academic_year_id, frequency, annual_concession_pct, notes, updated_at
  ) VALUES (
    v_school_id, p_student_id, v_year.id, v_freq, v_concession, p_notes, NOW()
  )
  ON CONFLICT (school_id, student_id, academic_year_id)
  DO UPDATE SET
    frequency = EXCLUDED.frequency,
    annual_concession_pct = EXCLUDED.annual_concession_pct,
    notes = COALESCE(EXCLUDED.notes, student_fee_preferences.notes),
    updated_at = NOW()
  RETURNING * INTO v_rec;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Fee frequency preference saved successfully',
    'preference', jsonb_build_object(
      'id', v_rec.id,
      'studentId', v_rec.student_id,
      'academicYearId', v_rec.academic_year_id,
      'frequency', v_rec.frequency,
      'annualConcessionPct', v_rec.annual_concession_pct,
      'notes', v_rec.notes,
      'updatedAt', to_char(v_rec.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_student_fee_preference(UUID, VARCHAR, NUMERIC, TEXT, UUID) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 2.2 GET SCHOOL FEE RULES
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_school_fee_rules(
  p_academic_year_id UUID DEFAULT NULL,
  p_school_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id UUID;
  v_year RECORD;
  v_rules RECORD;
BEGIN
  IF public.current_session() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required', 'message', 'Valid school session required');
  END IF;

  v_school_id := COALESCE(p_school_id, public.current_school_id());
  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Tenant context missing');
  END IF;

  -- Resolve Academic Year
  SELECT id, name INTO v_year
    FROM public.academic_years
   WHERE school_id = v_school_id
     AND (p_academic_year_id IS NULL AND is_current = TRUE OR id = p_academic_year_id)
   LIMIT 1;

  IF v_year.id IS NULL THEN
    SELECT id, name INTO v_year
      FROM public.academic_years
     WHERE school_id = v_school_id
     ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF v_year.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'academic_year_missing');
  END IF;

  SELECT * INTO v_rules
    FROM public.school_fee_rules
   WHERE school_id = v_school_id
     AND academic_year_id = v_year.id
   LIMIT 1;

  IF v_rules.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'schoolId', v_school_id,
      'school_id', v_school_id,
      'academicYearId', v_year.id,
      'academic_year_id', v_year.id,
      'academicYearName', v_year.name,
      'rules', jsonb_build_object(
        'school_id', v_school_id,
        'schoolId', v_school_id,
        'academic_year_id', v_year.id,
        'academicYearId', v_year.id,
        'monthly_discount_pct', 0.00,
        'monthlyDiscountPct', 0.00,
        'quarterly_discount_pct', 5.00,
        'quarterlyDiscountPct', 5.00,
        'annual_discount_pct', 10.00,
        'annualDiscountPct', 10.00,
        'due_day_of_month', 10,
        'dueDayOfMonth', 10,
        'grace_period_days', 5,
        'gracePeriodDays', 5,
        'enable_late_fee', false,
        'enableLateFee', false,
        'late_fee_type', 'FLAT',
        'lateFeeType', 'FLAT',
        'late_fee_amount', 100.00,
        'lateFeeAmount', 100.00
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'schoolId', v_rules.school_id,
    'school_id', v_rules.school_id,
    'academicYearId', v_rules.academic_year_id,
    'academic_year_id', v_rules.academic_year_id,
    'academicYearName', v_year.name,
    'rules', jsonb_build_object(
      'id', v_rules.id,
      'school_id', v_rules.school_id,
      'schoolId', v_rules.school_id,
      'academic_year_id', v_rules.academic_year_id,
      'academicYearId', v_rules.academic_year_id,
      'monthly_discount_pct', v_rules.monthly_discount_pct,
      'monthlyDiscountPct', v_rules.monthly_discount_pct,
      'quarterly_discount_pct', v_rules.quarterly_discount_pct,
      'quarterlyDiscountPct', v_rules.quarterly_discount_pct,
      'annual_discount_pct', v_rules.annual_discount_pct,
      'annualDiscountPct', v_rules.annual_discount_pct,
      'due_day_of_month', v_rules.due_day_of_month,
      'dueDayOfMonth', v_rules.due_day_of_month,
      'grace_period_days', v_rules.grace_period_days,
      'gracePeriodDays', v_rules.grace_period_days,
      'enable_late_fee', v_rules.enable_late_fee,
      'enableLateFee', v_rules.enable_late_fee,
      'late_fee_type', v_rules.late_fee_type,
      'lateFeeType', v_rules.late_fee_type,
      'late_fee_amount', v_rules.late_fee_amount,
      'lateFeeAmount', v_rules.late_fee_amount,
      'updated_at', to_char(v_rules.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'updatedAt', to_char(v_rules.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_school_fee_rules(UUID, UUID) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 2.3 UPDATE SCHOOL FEE RULES (OBJECT-PAYLOAD OVERLOAD)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_school_fee_rules(
  p_rules JSONB,
  p_academic_year_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id UUID;
  v_year RECORD;
  v_monthly_disc NUMERIC(5, 2);
  v_quarterly_disc NUMERIC(5, 2);
  v_annual_disc NUMERIC(5, 2);
  v_due_day INT;
  v_grace_days INT;
  v_enable_late BOOLEAN;
  v_late_type VARCHAR;
  v_late_amount NUMERIC(10, 2);
  v_rec RECORD;
BEGIN
  IF public.current_session() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required', 'message', 'Valid school session required');
  END IF;

  v_school_id := COALESCE(NULLIF(p_rules->>'school_id', '')::UUID, NULLIF(p_rules->>'schoolId', '')::UUID, public.current_school_id());
  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Tenant context missing');
  END IF;

  -- Resolve Academic Year
  SELECT id, name INTO v_year
    FROM public.academic_years
   WHERE school_id = v_school_id
     AND (
       (p_academic_year_id IS NOT NULL AND id = p_academic_year_id) OR
       (NULLIF(p_rules->>'academic_year_id', '') IS NOT NULL AND id = (p_rules->>'academic_year_id')::UUID) OR
       (NULLIF(p_rules->>'academicYearId', '') IS NOT NULL AND id = (p_rules->>'academicYearId')::UUID) OR
       (p_academic_year_id IS NULL AND is_current = TRUE)
     )
   LIMIT 1;

  IF v_year.id IS NULL THEN
    SELECT id, name INTO v_year
      FROM public.academic_years
     WHERE school_id = v_school_id
     ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF v_year.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'academic_year_missing');
  END IF;

  -- Parse and clamp inputs
  v_monthly_disc := GREATEST(0.00, LEAST(100.00, COALESCE((p_rules->>'monthly_discount_pct')::NUMERIC, (p_rules->>'monthlyDiscountPct')::NUMERIC, 0.00)));
  v_quarterly_disc := GREATEST(0.00, LEAST(100.00, COALESCE((p_rules->>'quarterly_discount_pct')::NUMERIC, (p_rules->>'quarterlyDiscountPct')::NUMERIC, 0.00)));
  v_annual_disc := GREATEST(0.00, LEAST(100.00, COALESCE((p_rules->>'annual_discount_pct')::NUMERIC, (p_rules->>'annualDiscountPct')::NUMERIC, 0.00)));
  v_due_day := GREATEST(1, LEAST(28, COALESCE((p_rules->>'due_day_of_month')::INT, (p_rules->>'dueDayOfMonth')::INT, 10)));
  v_grace_days := GREATEST(0, LEAST(30, COALESCE((p_rules->>'grace_period_days')::INT, (p_rules->>'gracePeriodDays')::INT, 5)));
  v_enable_late := COALESCE((p_rules->>'enable_late_fee')::BOOLEAN, (p_rules->>'enableLateFee')::BOOLEAN, FALSE);
  v_late_type := UPPER(TRIM(COALESCE(p_rules->>'late_fee_type', p_rules->>'lateFeeType', 'FLAT')));
  IF v_late_type NOT IN ('FLAT', 'DAILY') THEN
    v_late_type := 'FLAT';
  END IF;
  v_late_amount := GREATEST(0.00, COALESCE((p_rules->>'late_fee_amount')::NUMERIC, (p_rules->>'lateFeeAmount')::NUMERIC, 0.00));

  INSERT INTO public.school_fee_rules (
    school_id, academic_year_id, monthly_discount_pct, quarterly_discount_pct, annual_discount_pct,
    due_day_of_month, grace_period_days, enable_late_fee, late_fee_type, late_fee_amount, updated_at
  ) VALUES (
    v_school_id, v_year.id, v_monthly_disc, v_quarterly_disc, v_annual_disc,
    v_due_day, v_grace_days, v_enable_late, v_late_type, v_late_amount, NOW()
  )
  ON CONFLICT (school_id, academic_year_id)
  DO UPDATE SET
    monthly_discount_pct = EXCLUDED.monthly_discount_pct,
    quarterly_discount_pct = EXCLUDED.quarterly_discount_pct,
    annual_discount_pct = EXCLUDED.annual_discount_pct,
    due_day_of_month = EXCLUDED.due_day_of_month,
    grace_period_days = EXCLUDED.grace_period_days,
    enable_late_fee = EXCLUDED.enable_late_fee,
    late_fee_type = EXCLUDED.late_fee_type,
    late_fee_amount = EXCLUDED.late_fee_amount,
    updated_at = NOW()
  RETURNING * INTO v_rec;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Fee billing rules saved successfully',
    'data', jsonb_build_object(
      'id', v_rec.id,
      'school_id', v_rec.school_id,
      'schoolId', v_rec.school_id,
      'academic_year_id', v_rec.academic_year_id,
      'academicYearId', v_rec.academic_year_id,
      'monthly_discount_pct', v_rec.monthly_discount_pct,
      'monthlyDiscountPct', v_rec.monthly_discount_pct,
      'quarterly_discount_pct', v_rec.quarterly_discount_pct,
      'quarterlyDiscountPct', v_rec.quarterly_discount_pct,
      'annual_discount_pct', v_rec.annual_discount_pct,
      'annualDiscountPct', v_rec.annual_discount_pct,
      'due_day_of_month', v_rec.due_day_of_month,
      'dueDayOfMonth', v_rec.due_day_of_month,
      'grace_period_days', v_rec.grace_period_days,
      'gracePeriodDays', v_rec.grace_period_days,
      'enable_late_fee', v_rec.enable_late_fee,
      'enableLateFee', v_rec.enable_late_fee,
      'late_fee_type', v_rec.late_fee_type,
      'lateFeeType', v_rec.late_fee_type,
      'late_fee_amount', v_rec.late_fee_amount,
      'lateFeeAmount', v_rec.late_fee_amount,
      'updated_at', to_char(v_rec.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'updatedAt', to_char(v_rec.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    ),
    'rules', jsonb_build_object(
      'id', v_rec.id,
      'school_id', v_rec.school_id,
      'schoolId', v_rec.school_id,
      'academic_year_id', v_rec.academic_year_id,
      'academicYearId', v_rec.academic_year_id,
      'monthly_discount_pct', v_rec.monthly_discount_pct,
      'monthlyDiscountPct', v_rec.monthly_discount_pct,
      'quarterly_discount_pct', v_rec.quarterly_discount_pct,
      'quarterlyDiscountPct', v_rec.quarterly_discount_pct,
      'annual_discount_pct', v_rec.annual_discount_pct,
      'annualDiscountPct', v_rec.annual_discount_pct,
      'due_day_of_month', v_rec.due_day_of_month,
      'dueDayOfMonth', v_rec.due_day_of_month,
      'grace_period_days', v_rec.grace_period_days,
      'gracePeriodDays', v_rec.grace_period_days,
      'enable_late_fee', v_rec.enable_late_fee,
      'enableLateFee', v_rec.enable_late_fee,
      'late_fee_type', v_rec.late_fee_type,
      'lateFeeType', v_rec.late_fee_type,
      'late_fee_amount', v_rec.late_fee_amount,
      'lateFeeAmount', v_rec.late_fee_amount,
      'updated_at', to_char(v_rec.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'updatedAt', to_char(v_rec.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_school_fee_rules(JSONB, UUID) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 2.3b UPDATE SCHOOL FEE RULES (INDIVIDUAL PARAMETERS OVERLOAD)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_school_fee_rules(
  p_school_id UUID,
  p_academic_year_id UUID,
  p_monthly_discount_pct NUMERIC,
  p_quarterly_discount_pct NUMERIC,
  p_annual_discount_pct NUMERIC,
  p_due_day_of_month INT,
  p_grace_period_days INT,
  p_enable_late_fee BOOLEAN,
  p_late_fee_type VARCHAR,
  p_late_fee_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN public.update_school_fee_rules(
    jsonb_build_object(
      'school_id', p_school_id,
      'monthly_discount_pct', p_monthly_discount_pct,
      'quarterly_discount_pct', p_quarterly_discount_pct,
      'annual_discount_pct', p_annual_discount_pct,
      'due_day_of_month', p_due_day_of_month,
      'grace_period_days', p_grace_period_days,
      'enable_late_fee', p_enable_late_fee,
      'late_fee_type', p_late_fee_type,
      'late_fee_amount', p_late_fee_amount
    ),
    p_academic_year_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_school_fee_rules(UUID, UUID, NUMERIC, NUMERIC, NUMERIC, INT, INT, BOOLEAN, VARCHAR, NUMERIC) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 2.4 ADD STUDENT FEE CHARGE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_student_fee_charge(
  p_student_id UUID,
  p_charge_type VARCHAR,
  p_amount NUMERIC,
  p_description TEXT,
  p_effective_date DATE DEFAULT NULL,
  p_academic_year_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id UUID;
  v_year RECORD;
  v_type VARCHAR;
  v_eff_date DATE;
  v_descr TEXT;
  v_inv_id UUID;
  v_inv_no VARCHAR;
  v_charge RECORD;
BEGIN
  IF public.current_session() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required', 'message', 'Valid school session required');
  END IF;

  v_school_id := public.current_school_id();
  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Tenant context missing');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount', 'message', 'Charge amount must be greater than zero');
  END IF;

  v_type := UPPER(TRIM(COALESCE(p_charge_type, 'OTHER')));
  IF v_type NOT IN ('ADMISSION', 'FINE_PENALTY', 'EXAM', 'ANNUAL', 'OTHER') THEN
    v_type := 'OTHER';
  END IF;

  -- Resolve Academic Year
  SELECT id, name INTO v_year
    FROM public.academic_years
   WHERE school_id = v_school_id
     AND (p_academic_year_id IS NULL AND is_current = TRUE OR id = p_academic_year_id)
   LIMIT 1;

  IF v_year.id IS NULL THEN
    SELECT id, name INTO v_year
      FROM public.academic_years
     WHERE school_id = v_school_id
     ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF v_year.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'academic_year_missing');
  END IF;

  -- Verify student
  IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id AND school_id = v_school_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found');
  END IF;

  v_eff_date := COALESCE(p_effective_date, CURRENT_DATE);
  v_descr := COALESCE(NULLIF(TRIM(p_description), ''), 'Additional Fee Charge: ' || v_type);

  -- Create corresponding invoice row so payments can reference invoice_id
  v_inv_no := 'CHG-' || to_char(v_eff_date, 'YYYYMM') || '-' || upper(substring(gen_random_uuid()::text, 1, 6));

  INSERT INTO public.student_fee_invoices (
    school_id, academic_year_id, student_id, invoice_number,
    month_name, total_amount, paid_amount, discount_amount, fine_amount,
    due_date, status, items
  ) VALUES (
    v_school_id, v_year.id, p_student_id, v_inv_no,
    to_char(v_eff_date, 'FMMonth YYYY') || ' (' || v_type || ')',
    p_amount, 0.00, 0.00, 0.00,
    v_eff_date + 10, 'UNPAID',
    jsonb_build_array(jsonb_build_object('description', v_descr, 'charge_type', v_type, 'amount', p_amount))
  ) RETURNING id INTO v_inv_id;

  -- Insert into student_fee_additional_charges
  INSERT INTO public.student_fee_additional_charges (
    school_id, student_id, academic_year_id, charge_type, amount, description,
    effective_date, status, invoice_id
  ) VALUES (
    v_school_id, p_student_id, v_year.id, v_type, p_amount, v_descr,
    v_eff_date, 'PENDING', v_inv_id
  ) RETURNING * INTO v_charge;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Additional charge added successfully',
    'charge', jsonb_build_object(
      'id', v_charge.id,
      'studentId', v_charge.student_id,
      'academicYearId', v_charge.academic_year_id,
      'chargeType', v_charge.charge_type,
      'amount', v_charge.amount,
      'description', v_charge.description,
      'effectiveDate', to_char(v_charge.effective_date, 'YYYY-MM-DD'),
      'status', v_charge.status,
      'invoiceId', v_charge.invoice_id
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_student_fee_charge(UUID, VARCHAR, NUMERIC, TEXT, DATE, UUID) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 2.5 GENERATE STUDENT SESSION SCHEDULE (APRIL TO MARCH SESSION LOGIC)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_student_session_schedule(
  p_student_id UUID,
  p_academic_year_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id UUID;
  v_year RECORD;
  v_enr RECORD;
  v_pref RECORD;
  v_rules RECORD;
  v_base_monthly_fee NUMERIC(10, 2) := 0.00;
  v_fee_items JSONB := '[]'::JSONB;
  v_frequency VARCHAR := 'MONTHLY';
  v_concession_pct NUMERIC(5, 2) := 0.00;
  v_due_day INT := 10;
  v_grace_days INT := 5;
  v_enable_late_fee BOOLEAN := FALSE;
  v_late_fee_type VARCHAR := 'FLAT';
  v_late_fee_amount NUMERIC(10, 2) := 0.00;
  v_session_start DATE;
  v_session_end DATE;
  v_start_year INT;
  v_generated_count INT := 0;
  m INT;
  q INT;
  v_period_start DATE;
  v_period_name VARCHAR;
  v_existing_id UUID;
  v_disc_pct NUMERIC(5, 2);
  v_disc_amount NUMERIC(10, 2);
  v_net_amount NUMERIC(10, 2);
  v_due_date DATE;
  v_fine_amt NUMERIC(10, 2);
  v_status VARCHAR;
  v_inv_no VARCHAR;
  v_gross_q_fee NUMERIC(10, 2);
  v_gross_annual_fee NUMERIC(10, 2);
BEGIN
  IF public.current_session() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required', 'message', 'Valid school session required');
  END IF;

  v_school_id := public.current_school_id();
  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Tenant context missing');
  END IF;

  -- Resolve Academic Year
  SELECT id, name, start_date, end_date INTO v_year
    FROM public.academic_years
   WHERE school_id = v_school_id
     AND (p_academic_year_id IS NULL AND is_current = TRUE OR id = p_academic_year_id)
   LIMIT 1;

  IF v_year.id IS NULL THEN
    SELECT id, name, start_date, end_date INTO v_year
      FROM public.academic_years
     WHERE school_id = v_school_id
     ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF v_year.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'academic_year_missing');
  END IF;

  -- Resolve Active Enrollment & Class
  SELECT se.class_id, c.name AS class_name
    INTO v_enr
    FROM public.students st
    LEFT JOIN LATERAL (
      SELECT se.class_id
        FROM public.student_enrollments se
       WHERE se.student_id = st.id
         AND se.school_id = v_school_id
         AND (v_year.id IS NULL OR se.academic_year_id = v_year.id)
         AND se.status = 'ACTIVE'
         AND se.deleted_at IS NULL
       ORDER BY se.created_at DESC LIMIT 1
    ) se ON TRUE
    LEFT JOIN public.classes c ON c.id = se.class_id
   WHERE st.id = p_student_id AND st.school_id = v_school_id;

  IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id AND school_id = v_school_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found');
  END IF;

  -- Load Base Monthly Fee Structures for Student's Class
  IF v_enr.class_id IS NOT NULL THEN
    SELECT COALESCE(SUM(fs.amount), 0.00),
           COALESCE(jsonb_agg(jsonb_build_object(
             'description', COALESCE(fc.name, 'Monthly Tuition Fee'),
             'amount', fs.amount
           )), '[]'::JSONB)
      INTO v_base_monthly_fee, v_fee_items
      FROM public.fee_structures fs
      LEFT JOIN public.fee_categories fc ON fc.id = fs.fee_category_id
     WHERE fs.school_id = v_school_id
       AND fs.academic_year_id = v_year.id
       AND fs.class_id = v_enr.class_id
       AND fs.deleted_at IS NULL;
  END IF;

  IF v_base_monthly_fee <= 0 THEN
    v_base_monthly_fee := 2500.00;
    v_fee_items := jsonb_build_array(jsonb_build_object('description', 'Composite Monthly Tuition Fee', 'amount', 2500.00));
  END IF;

  -- Load Student Fee Frequency Preference
  SELECT frequency, annual_concession_pct, notes
    INTO v_pref
    FROM public.student_fee_preferences
   WHERE school_id = v_school_id
     AND student_id = p_student_id
     AND academic_year_id = v_year.id
   LIMIT 1;

  v_frequency := UPPER(TRIM(COALESCE(v_pref.frequency, 'MONTHLY')));
  v_concession_pct := GREATEST(0.00, LEAST(100.00, COALESCE(v_pref.annual_concession_pct, 0.00)));

  -- Load School Fee Billing Rules
  SELECT * INTO v_rules
    FROM public.school_fee_rules
   WHERE school_id = v_school_id
     AND academic_year_id = v_year.id
   LIMIT 1;

  v_due_day := LEAST(28, GREATEST(1, COALESCE(v_rules.due_day_of_month, 10)));
  v_grace_days := GREATEST(0, COALESCE(v_rules.grace_period_days, 5));
  v_enable_late_fee := COALESCE(v_rules.enable_late_fee, FALSE);
  v_late_fee_type := UPPER(TRIM(COALESCE(v_rules.late_fee_type, 'FLAT')));
  v_late_fee_amount := GREATEST(0.00, COALESCE(v_rules.late_fee_amount, 0.00));

  -- Determine Session Boundaries (CBSE Session: April 1 to March 31)
  IF v_year.start_date IS NOT NULL THEN
    v_session_start := date_trunc('month', v_year.start_date)::DATE;
  ELSE
    v_start_year := COALESCE(NULLIF(substring(v_year.name from '^([0-9]{4})'), '')::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT);
    v_session_start := make_date(v_start_year, 4, 1);
  END IF;

  v_session_end := COALESCE(v_year.end_date, (v_session_start + INTERVAL '12 months' - INTERVAL '1 day')::DATE);

  -- ----------------------------------------------------------------------------
  -- BRANCH 1: MONTHLY FREQUENCY
  -- "If Monthly: Fee generated for every month 1st from April to current month"
  -- ----------------------------------------------------------------------------
  IF v_frequency = 'MONTHLY' THEN
    FOR m IN 0..11 LOOP
      v_period_start := (v_session_start + (m || ' month')::INTERVAL)::DATE;
      
      -- Fee generated up to current month (or session end)
      IF v_period_start > CURRENT_DATE OR v_period_start > v_session_end THEN
        EXIT;
      END IF;

      v_period_name := to_char(v_period_start, 'FMMonth YYYY');

      -- Check if invoice already exists
      SELECT id INTO v_existing_id
        FROM public.student_fee_invoices
       WHERE school_id = v_school_id
         AND student_id = p_student_id
         AND academic_year_id = v_year.id
         AND month_name = v_period_name
         AND deleted_at IS NULL
       LIMIT 1;

      IF v_existing_id IS NULL THEN
        v_disc_pct := LEAST(100.00, COALESCE(v_rules.monthly_discount_pct, 0.00) + v_concession_pct);
        v_disc_amount := ROUND(v_base_monthly_fee * (v_disc_pct / 100.0), 2);
        v_net_amount := GREATEST(0.00, v_base_monthly_fee - v_disc_amount);
        v_due_date := make_date(EXTRACT(YEAR FROM v_period_start)::INT, EXTRACT(MONTH FROM v_period_start)::INT, v_due_day);

        -- Late Fee calculation
        IF v_enable_late_fee AND CURRENT_DATE > (v_due_date + v_grace_days) THEN
          IF v_late_fee_type = 'DAILY' THEN
            v_fine_amt := (CURRENT_DATE - (v_due_date + v_grace_days)) * v_late_fee_amount;
          ELSE
            v_fine_amt := v_late_fee_amount;
          END IF;
          v_status := 'OVERDUE';
        ELSE
          v_fine_amt := 0.00;
          v_status := 'UNPAID';
        END IF;

        v_inv_no := 'INV-' || to_char(v_period_start, 'YYYYMM') || '-' || upper(substring(gen_random_uuid()::text, 1, 6));

        INSERT INTO public.student_fee_invoices (
          school_id, academic_year_id, student_id, invoice_number,
          month_name, total_amount, paid_amount, discount_amount, fine_amount,
          due_date, status, items
        ) VALUES (
          v_school_id, v_year.id, p_student_id, v_inv_no,
          v_period_name, v_net_amount, 0.00, v_disc_amount, v_fine_amt,
          v_due_date, v_status, v_fee_items
        );

        v_generated_count := v_generated_count + 1;
      END IF;
    END LOOP;

  -- ----------------------------------------------------------------------------
  -- BRANCH 2: QUARTERLY FREQUENCY
  -- "If Quarterly: Fee applied every 3 months (April, July, October, January)"
  -- ----------------------------------------------------------------------------
  ELSIF v_frequency = 'QUARTERLY' THEN
    FOR q IN 0..3 LOOP
      v_period_start := (v_session_start + ((q * 3) || ' month')::INTERVAL)::DATE;

      -- Apply quarterly schedule up to current date
      IF v_period_start > CURRENT_DATE OR v_period_start > v_session_end THEN
        EXIT;
      END IF;

      v_period_name := CASE q
        WHEN 0 THEN 'Q1 (Apr - Jun ' || to_char(v_period_start, 'YYYY') || ')'
        WHEN 1 THEN 'Q2 (Jul - Sep ' || to_char(v_period_start, 'YYYY') || ')'
        WHEN 2 THEN 'Q3 (Oct - Dec ' || to_char(v_period_start, 'YYYY') || ')'
        ELSE 'Q4 (Jan - Mar ' || to_char(v_period_start, 'YYYY') || ')'
      END;

      SELECT id INTO v_existing_id
        FROM public.student_fee_invoices
       WHERE school_id = v_school_id
         AND student_id = p_student_id
         AND academic_year_id = v_year.id
         AND month_name = v_period_name
         AND deleted_at IS NULL
       LIMIT 1;

      IF v_existing_id IS NULL THEN
        v_gross_q_fee := v_base_monthly_fee * 3;
        v_disc_pct := LEAST(100.00, COALESCE(v_rules.quarterly_discount_pct, 0.00) + v_concession_pct);
        v_disc_amount := ROUND(v_gross_q_fee * (v_disc_pct / 100.0), 2);
        v_net_amount := GREATEST(0.00, v_gross_q_fee - v_disc_amount);
        v_due_date := make_date(EXTRACT(YEAR FROM v_period_start)::INT, EXTRACT(MONTH FROM v_period_start)::INT, v_due_day);

        IF v_enable_late_fee AND CURRENT_DATE > (v_due_date + v_grace_days) THEN
          IF v_late_fee_type = 'DAILY' THEN
            v_fine_amt := (CURRENT_DATE - (v_due_date + v_grace_days)) * v_late_fee_amount;
          ELSE
            v_fine_amt := v_late_fee_amount;
          END IF;
          v_status := 'OVERDUE';
        ELSE
          v_fine_amt := 0.00;
          v_status := 'UNPAID';
        END IF;

        v_inv_no := 'INV-Q' || (q + 1) || '-' || to_char(v_period_start, 'YYYYMM') || '-' || upper(substring(gen_random_uuid()::text, 1, 6));

        INSERT INTO public.student_fee_invoices (
          school_id, academic_year_id, student_id, invoice_number,
          month_name, total_amount, paid_amount, discount_amount, fine_amount,
          due_date, status, items
        ) VALUES (
          v_school_id, v_year.id, p_student_id, v_inv_no,
          v_period_name, v_net_amount, 0.00, v_disc_amount, v_fine_amt,
          v_due_date, v_status,
          jsonb_build_array(jsonb_build_object(
            'description', 'Quarterly Composite Academic Fee (3 Months)',
            'amount', v_net_amount
          ))
        );

        v_generated_count := v_generated_count + 1;
      END IF;
    END LOOP;

  -- ----------------------------------------------------------------------------
  -- BRANCH 3: ANNUAL / YEARLY FREQUENCY
  -- "If Yearly: Fee applied for whole session in one go"
  -- ----------------------------------------------------------------------------
  ELSE
    v_period_name := 'Annual Session Fee (' || COALESCE(v_year.name, to_char(v_session_start, 'YYYY') || '-' || to_char(v_session_end, 'YYYY')) || ')';

    SELECT id INTO v_existing_id
      FROM public.student_fee_invoices
     WHERE school_id = v_school_id
       AND student_id = p_student_id
       AND academic_year_id = v_year.id
       AND month_name = v_period_name
       AND deleted_at IS NULL
     LIMIT 1;

    IF v_existing_id IS NULL THEN
      v_gross_annual_fee := v_base_monthly_fee * 12;
      v_disc_pct := LEAST(100.00, COALESCE(v_rules.annual_discount_pct, 0.00) + v_concession_pct);
      v_disc_amount := ROUND(v_gross_annual_fee * (v_disc_pct / 100.0), 2);
      v_net_amount := GREATEST(0.00, v_gross_annual_fee - v_disc_amount);
      v_due_date := make_date(EXTRACT(YEAR FROM v_session_start)::INT, EXTRACT(MONTH FROM v_session_start)::INT, v_due_day);

      IF v_enable_late_fee AND CURRENT_DATE > (v_due_date + v_grace_days) THEN
        IF v_late_fee_type = 'DAILY' THEN
          v_fine_amt := (CURRENT_DATE - (v_due_date + v_grace_days)) * v_late_fee_amount;
        ELSE
          v_fine_amt := v_late_fee_amount;
        END IF;
        v_status := 'OVERDUE';
      ELSE
        v_fine_amt := 0.00;
        v_status := 'UNPAID';
      END IF;

      v_inv_no := 'INV-ANNUAL-' || to_char(v_session_start, 'YYYY') || '-' || upper(substring(gen_random_uuid()::text, 1, 6));

      INSERT INTO public.student_fee_invoices (
        school_id, academic_year_id, student_id, invoice_number,
        month_name, total_amount, paid_amount, discount_amount, fine_amount,
        due_date, status, items
      ) VALUES (
        v_school_id, v_year.id, p_student_id, v_inv_no,
        v_period_name, v_net_amount, 0.00, v_disc_amount, v_fine_amt,
        v_due_date, v_status,
        jsonb_build_array(jsonb_build_object(
          'description', 'Full Session Annual Composite Fee',
          'amount', v_net_amount
        ))
      );

      v_generated_count := v_generated_count + 1;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'studentId', p_student_id,
    'academicYearId', v_year.id,
    'frequency', v_frequency,
    'generatedCount', v_generated_count,
    'message', 'Session fee schedule processed successfully'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_student_session_schedule(UUID, UUID) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 2.6 GET STUDENT FEE LEDGER (SESSION SCOPED TIMELINE & FINANCIAL SUMMARY)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_student_fee_ledger(
  p_student_id UUID,
  p_academic_year_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id UUID;
  v_student RECORD;
  v_year RECORD;
  v_pref RECORD;
  v_rules RECORD;
  v_invoices JSONB := '[]'::JSONB;
  v_charges JSONB := '[]'::JSONB;
  v_payments JSONB := '[]'::JSONB;
  v_entries JSONB := '[]'::JSONB;
  v_total_billed NUMERIC(10, 2) := 0.00;
  v_total_paid NUMERIC(10, 2) := 0.00;
  v_total_discount NUMERIC(10, 2) := 0.00;
  v_advance_balance NUMERIC(10, 2) := 0.00;
  v_pending_due NUMERIC(10, 2) := 0.00;
  v_running_balance NUMERIC(10, 2) := 0.00;
  v_invoice_count INT := 0;
  r RECORD;
BEGIN
  IF public.current_session() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required', 'message', 'Valid school session required');
  END IF;

  v_school_id := public.current_school_id();
  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Tenant context missing');
  END IF;

  -- Resolve Academic Year
  SELECT id, name, start_date, end_date INTO v_year
    FROM public.academic_years
   WHERE school_id = v_school_id
     AND (p_academic_year_id IS NULL AND is_current = TRUE OR id = p_academic_year_id)
   LIMIT 1;

  IF v_year.id IS NULL THEN
    SELECT id, name, start_date, end_date INTO v_year
      FROM public.academic_years
     WHERE school_id = v_school_id
     ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF v_year.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'academic_year_missing');
  END IF;

  -- Resolve Student with Active Enrollment
  SELECT s.id, TRIM(s.first_name || ' ' || COALESCE(s.last_name, '')) AS student_name,
         s.admission_number, COALESCE(c.name, 'Class') AS class_name, COALESCE(sec.name, 'Section A') AS section_name
    INTO v_student
    FROM public.students s
    LEFT JOIN LATERAL (
      SELECT se.class_id, se.section_id
        FROM public.student_enrollments se
       WHERE se.student_id = s.id 
         AND se.school_id = v_school_id
         AND (v_year.id IS NULL OR se.academic_year_id = v_year.id)
       ORDER BY se.created_at DESC LIMIT 1
    ) enr ON TRUE
    LEFT JOIN public.classes c ON c.id = enr.class_id
    LEFT JOIN public.sections sec ON sec.id = enr.section_id
   WHERE s.id = p_student_id AND s.school_id = v_school_id;

  IF v_student.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found');
  END IF;

  -- Check if session schedule needs generation (if student has no active invoices for this year)
  SELECT COUNT(*) INTO v_invoice_count
    FROM public.student_fee_invoices
   WHERE school_id = v_school_id
     AND student_id = p_student_id
     AND academic_year_id = v_year.id
     AND deleted_at IS NULL;

  IF v_invoice_count = 0 THEN
    PERFORM public.generate_student_session_schedule(p_student_id, v_year.id);
  END IF;

  -- Load Frequency Preference
  SELECT frequency, annual_concession_pct, notes
    INTO v_pref
    FROM public.student_fee_preferences
   WHERE school_id = v_school_id
     AND student_id = p_student_id
     AND academic_year_id = v_year.id
   LIMIT 1;

  -- Load Rules
  SELECT * INTO v_rules
    FROM public.school_fee_rules
   WHERE school_id = v_school_id
     AND academic_year_id = v_year.id
   LIMIT 1;

  -- Load Invoices
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', inv.id,
           'invoice_number', inv.invoice_number,
           'month_name', inv.month_name,
           'total_amount', inv.total_amount,
           'paid_amount', inv.paid_amount,
           'discount_amount', inv.discount_amount,
           'fine_amount', inv.fine_amount,
           'due_date', inv.due_date,
           'status', inv.status,
           'created_at', inv.created_at
         ) ORDER BY inv.due_date ASC), '[]'::JSONB),
         COALESCE(SUM(inv.total_amount + COALESCE(inv.fine_amount, 0.00)), 0.00),
         COALESCE(SUM(inv.discount_amount), 0.00)
    INTO v_invoices, v_total_billed, v_total_discount
    FROM public.student_fee_invoices inv
   WHERE inv.school_id = v_school_id
     AND inv.student_id = p_student_id
     AND inv.academic_year_id = v_year.id
     AND inv.deleted_at IS NULL;

  -- Load Additional Charges
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', chg.id,
           'charge_type', chg.charge_type,
           'amount', chg.amount,
           'description', chg.description,
           'effective_date', chg.effective_date,
           'status', chg.status,
           'invoice_id', chg.invoice_id,
           'created_at', chg.created_at
         ) ORDER BY chg.effective_date ASC), '[]'::JSONB)
    INTO v_charges
    FROM public.student_fee_additional_charges chg
   WHERE chg.school_id = v_school_id
     AND chg.student_id = p_student_id
     AND chg.academic_year_id = v_year.id
     AND chg.deleted_at IS NULL;

  -- Load Payments
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', p.id,
           'receipt_number', p.receipt_number,
           'amount_paid', p.amount_paid,
           'payment_mode', p.payment_mode,
           'payment_date', p.payment_date,
           'transaction_reference', p.transaction_reference,
           'remarks', p.remarks,
           'created_at', p.created_at
         ) ORDER BY p.payment_date ASC), '[]'::JSONB),
         COALESCE(SUM(p.amount_paid), 0.00)
    INTO v_payments, v_total_paid
    FROM public.fee_payments p
   WHERE p.school_id = v_school_id
     AND p.student_id = p_student_id
     AND (p.academic_year_id IS NULL OR p.academic_year_id = v_year.id)
     AND p.deleted_at IS NULL;

  -- Assemble Chronological Unified Ledger Timeline
  -- Charges with linked invoice are represented as CHARGE entries (invoices tied to charges are excluded to prevent double debit)
  v_total_billed := 0.00;
  v_total_paid := 0.00;

  FOR r IN (
    SELECT inv.due_date AS entry_date,
           'INVOICE' AS entry_type,
           inv.invoice_number AS ref_no,
           'Fee Invoice: ' || COALESCE(inv.month_name, to_char(inv.due_date, 'Mon YYYY')) AS descr,
           (inv.total_amount + COALESCE(inv.fine_amount, 0.00)) AS debit_amt,
           0.00 AS credit_amt,
           inv.status AS item_status,
           NULL::VARCHAR AS pay_mode,
           1 AS sort_prio,
           inv.created_at
      FROM public.student_fee_invoices inv
     WHERE inv.school_id = v_school_id
       AND inv.student_id = p_student_id
       AND inv.academic_year_id = v_year.id
       AND inv.deleted_at IS NULL
       AND inv.id NOT IN (
         SELECT c.invoice_id FROM public.student_fee_additional_charges c
          WHERE c.invoice_id IS NOT NULL AND c.school_id = v_school_id AND c.deleted_at IS NULL
       )
    UNION ALL
    SELECT chg.effective_date AS entry_date,
           'CHARGE' AS entry_type,
           chg.charge_type AS ref_no,
           chg.description AS descr,
           chg.amount AS debit_amt,
           0.00 AS credit_amt,
           chg.status AS item_status,
           NULL::VARCHAR AS pay_mode,
           1 AS sort_prio,
           chg.created_at
      FROM public.student_fee_additional_charges chg
     WHERE chg.school_id = v_school_id
       AND chg.student_id = p_student_id
       AND chg.academic_year_id = v_year.id
       AND chg.deleted_at IS NULL
    UNION ALL
    SELECT p.payment_date AS entry_date,
           'PAYMENT' AS entry_type,
           p.receipt_number AS ref_no,
           'Payment Received (' || p.payment_mode || COALESCE(' - ' || NULLIF(p.transaction_reference, ''), '') || ')' AS descr,
           0.00 AS debit_amt,
           p.amount_paid AS credit_amt,
           'PAID' AS item_status,
           p.payment_mode AS pay_mode,
           2 AS sort_prio,
           p.created_at
      FROM public.fee_payments p
     WHERE p.school_id = v_school_id
       AND p.student_id = p_student_id
       AND (p.academic_year_id IS NULL OR p.academic_year_id = v_year.id)
       AND p.deleted_at IS NULL
     ORDER BY entry_date ASC, sort_prio ASC, created_at ASC
  ) LOOP
    v_total_billed := v_total_billed + r.debit_amt;
    v_total_paid := v_total_paid + r.credit_amt;
    v_running_balance := v_running_balance + r.debit_amt - r.credit_amt;
    v_entries := v_entries || jsonb_build_object(
      'date', to_char(r.entry_date, 'YYYY-MM-DD'),
      'type', r.entry_type,
      'referenceNumber', r.ref_no,
      'description', r.descr,
      'debit', r.debit_amt,
      'credit', r.credit_amt,
      'runningBalance', v_running_balance,
      'status', r.item_status,
      'paymentMode', r.pay_mode
    );
  END LOOP;

  -- Exact Financial Totals derived from unified ledger transactions:
  -- Debit increases due / decreases credit. Credit increases advance / decreases due.
  v_advance_balance := GREATEST(0.00, v_total_paid - v_total_billed);
  v_pending_due := GREATEST(0.00, v_total_billed - v_total_paid);

  RETURN jsonb_build_object(
    'success', true,
    'studentId', v_student.id,
    'studentName', v_student.student_name,
    'admissionNumber', v_student.admission_number,
    'className', v_student.class_name,
    'sectionName', v_student.section_name,
    'academicYearId', v_year.id,
    'academicYearName', COALESCE(v_year.name, '2026-2027'),
    'frequencyPreference', COALESCE(v_pref.frequency, 'MONTHLY'),
    'annualConcessionPct', COALESCE(v_pref.annual_concession_pct, 0.00),
    'feeRules', jsonb_build_object(
      'monthlyDiscountPct', COALESCE(v_rules.monthly_discount_pct, 0.00),
      'quarterlyDiscountPct', COALESCE(v_rules.quarterly_discount_pct, 0.00),
      'annualDiscountPct', COALESCE(v_rules.annual_discount_pct, 0.00),
      'dueDayOfMonth', COALESCE(v_rules.due_day_of_month, 10),
      'gracePeriodDays', COALESCE(v_rules.grace_period_days, 5),
      'enableLateFee', COALESCE(v_rules.enable_late_fee, FALSE),
      'lateFeeType', COALESCE(v_rules.late_fee_type, 'FLAT'),
      'lateFeeAmount', COALESCE(v_rules.late_fee_amount, 0.00)
    ),
    'totalBilled', v_total_billed,
    'totalPaid', v_total_paid,
    'totalDiscount', v_total_discount,
    'netBilled', v_total_billed,
    'advanceBalance', v_advance_balance,
    'pendingDue', v_pending_due,
    'invoices', v_invoices,
    'charges', v_charges,
    'payments', v_payments,
    'ledgerEntries', v_entries,
    'generatedAt', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_fee_ledger(UUID, UUID) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';


