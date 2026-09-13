-- ==============================================================================
-- SchoolSense B2B SaaS Subscription & School Wallet System
-- ==============================================================================

-- 1. School Subscriptions Table
CREATE TABLE IF NOT EXISTS public.school_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  per_student_fee NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  trial_ends_at TIMESTAMPTZ,
  next_billing_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month')::DATE,
  last_billed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_school_subscription UNIQUE (school_id)
);

-- 2. School Wallets Table (Allows Negative Balance for Postpaid Flexibility)
CREATE TABLE IF NOT EXISTS public.school_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  credit_limit NUMERIC(12, 2) NOT NULL DEFAULT -5000.00, -- Maximum allowable negative balance
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_school_wallet UNIQUE (school_id)
);

-- 3. Wallet Transactions Ledger
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES public.school_wallets(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL, -- Positive for Credit, Negative for Debit
  transaction_type VARCHAR(20) NOT NULL, -- 'CREDIT' or 'DEBIT'
  category VARCHAR(30) NOT NULL, -- 'TOP_UP', 'SUBSCRIPTION_FEE', 'ADJUSTMENT', 'REFUND'
  balance_after NUMERIC(12, 2) NOT NULL,
  reference_id VARCHAR(100) NOT NULL,
  description TEXT,
  student_count INTEGER DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'MANUAL',
  performed_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_school ON public.school_subscriptions(school_id);
CREATE INDEX IF NOT EXISTS idx_wallets_school ON public.school_wallets(school_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_school ON public.wallet_transactions(school_id, created_at DESC);

-- ==============================================================================
-- STORED PROCEDURES & RPCS
-- ==============================================================================

-- 1. Get School Subscription & Wallet Overview
CREATE OR REPLACE FUNCTION public.get_school_subscription_details(p_school_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub RECORD;
  v_wallet RECORD;
  v_active_students INTEGER;
  v_monthly_est NUMERIC(12, 2);
  v_txns JSONB;
BEGIN
  -- Ensure subscription exists
  SELECT * INTO v_sub FROM public.school_subscriptions WHERE school_id = p_school_id;
  IF v_sub.id IS NULL THEN
    INSERT INTO public.school_subscriptions (school_id, per_student_fee, status)
    VALUES (p_school_id, 20.00, 'ACTIVE')
    RETURNING * INTO v_sub;
  END IF;

  -- Ensure wallet exists
  SELECT * INTO v_wallet FROM public.school_wallets WHERE school_id = p_school_id;
  IF v_wallet.id IS NULL THEN
    INSERT INTO public.school_wallets (school_id, balance, status)
    VALUES (p_school_id, 0.00, 'ACTIVE')
    RETURNING * INTO v_wallet;
  END IF;

  -- Count Active Enrolled Students
  SELECT COUNT(DISTINCT s.id) INTO v_active_students
  FROM public.students s
  WHERE s.school_id = p_school_id AND s.status = 'ACTIVE' AND s.deleted_at IS NULL;

  v_monthly_est := ROUND(v_active_students * COALESCE(v_sub.per_student_fee, 20.00), 2);

  -- Fetch Recent 25 Transactions
  SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.created_at DESC), '[]'::jsonb)
  INTO v_txns
  FROM (
    SELECT id, amount, transaction_type, category, balance_after, reference_id, description, student_count, payment_method, created_at
    FROM public.wallet_transactions
    WHERE school_id = p_school_id
    ORDER BY created_at DESC
    LIMIT 25
  ) t;

  RETURN jsonb_build_object(
    'subscription', jsonb_build_object(
      'id', v_sub.id,
      'per_student_fee', v_sub.per_student_fee,
      'billing_cycle', v_sub.billing_cycle,
      'currency', v_sub.currency,
      'status', v_sub.status,
      'next_billing_date', v_sub.next_billing_date,
      'last_billed_date', v_sub.last_billed_date,
      'created_at', v_sub.created_at
    ),
    'wallet', jsonb_build_object(
      'id', v_wallet.id,
      'balance', v_wallet.balance,
      'credit_limit', v_wallet.credit_limit,
      'currency', v_wallet.currency,
      'status', v_wallet.status
    ),
    'stats', jsonb_build_object(
      'active_students', v_active_students,
      'estimated_monthly_fee', v_monthly_est
    ),
    'transactions', v_txns
  );
END;
$$;

-- 2. Top Up School Wallet
CREATE OR REPLACE FUNCTION public.top_up_school_wallet(
  p_school_id UUID,
  p_amount NUMERIC,
  p_method TEXT DEFAULT 'MANUAL',
  p_notes TEXT DEFAULT 'Wallet Top-Up by Administrator',
  p_performed_by_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_old_balance NUMERIC(12, 2);
  v_new_balance NUMERIC(12, 2);
  v_ref_id TEXT;
  v_txn_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Top-up amount must be greater than zero.';
  END IF;

  -- Ensure Wallet
  SELECT id, balance INTO v_wallet_id, v_old_balance
  FROM public.school_wallets WHERE school_id = p_school_id FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    INSERT INTO public.school_wallets (school_id, balance)
    VALUES (p_school_id, 0.00)
    RETURNING id, balance INTO v_wallet_id, v_old_balance;
  END IF;

  v_new_balance := v_old_balance + p_amount;
  v_ref_id := 'TOP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  -- Update Balance
  UPDATE public.school_wallets
  SET balance = v_new_balance, updated_at = NOW()
  WHERE id = v_wallet_id;

  -- Insert Transaction Ledger
  INSERT INTO public.wallet_transactions (
    school_id, wallet_id, amount, transaction_type, category, balance_after,
    reference_id, description, payment_method, performed_by_id
  ) VALUES (
    p_school_id, v_wallet_id, p_amount, 'CREDIT', 'TOP_UP', v_new_balance,
    v_ref_id, p_notes, p_method, p_performed_by_id
  )
  RETURNING id INTO v_txn_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'transaction_id', v_txn_id,
    'reference_id', v_ref_id,
    'old_balance', v_old_balance,
    'new_balance', v_new_balance,
    'amount', p_amount
  );
END;
$$;

-- 3. Calculate Monthly Subscription with Detailed Proration Roster Breakdown
CREATE OR REPLACE FUNCTION public.calculate_monthly_subscription(p_school_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub RECORD;
  v_rate NUMERIC(10, 2);
  v_students JSONB;
  v_total_fee NUMERIC(12, 2) := 0.00;
  v_total_students INTEGER := 0;
  v_month_days INTEGER;
  v_first_day_of_month DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get Subscription Rate
  SELECT * INTO v_sub FROM public.school_subscriptions WHERE school_id = p_school_id;
  v_rate := COALESCE(v_sub.per_student_fee, 20.00);

  v_first_day_of_month := DATE_TRUNC('month', v_today)::DATE;
  v_month_days := EXTRACT(DAY FROM (DATE_TRUNC('month', v_today) + INTERVAL '1 month - 1 day'))::INTEGER;

  -- Build detailed student list with proration calculation
  WITH student_roster AS (
    SELECT
      s.id AS student_id,
      s.admission_number,
      s.first_name || ' ' || COALESCE(s.last_name, '') AS student_name,
      s.created_at::DATE AS enrollment_date,
      s.status,
      c.name AS class_name,
      sec.name AS section_name,
      CASE
        -- If enrolled on or before 1st of month: full charge
        WHEN s.created_at::DATE <= v_first_day_of_month THEN v_rate
        -- If enrolled mid-month, check active days remaining in month
        ELSE
          CASE
            -- If active for less than 7 days in the cycle, apply discounted 1-week pro-rata
            WHEN (v_month_days - EXTRACT(DAY FROM s.created_at)::INTEGER + 1) < 7
              THEN ROUND(v_rate * ((v_month_days - EXTRACT(DAY FROM s.created_at)::INTEGER + 1)::NUMERIC / v_month_days::NUMERIC), 2)
            -- Otherwise charge full monthly price
            ELSE v_rate
          END
      END AS student_fee,
      CASE
        WHEN s.created_at::DATE <= v_first_day_of_month THEN 'Full Month (Enrolled on/before 1st)'
        WHEN (v_month_days - EXTRACT(DAY FROM s.created_at)::INTEGER + 1) < 7 THEN 'Prorated (< 7 days active in cycle)'
        ELSE 'Full Month (Mid-month enrollment)'
      END AS billing_note
    FROM public.students s
    LEFT JOIN public.student_enrollments se ON se.student_id = s.id AND se.deleted_at IS NULL
    LEFT JOIN public.classes c ON c.id = se.class_id
    LEFT JOIN public.sections sec ON sec.id = se.section_id
    WHERE s.school_id = p_school_id AND s.status = 'ACTIVE' AND s.deleted_at IS NULL
    ORDER BY s.created_at ASC
  )
  SELECT
    COALESCE(jsonb_agg(to_jsonb(r)), '[]'::jsonb),
    COALESCE(SUM(student_fee), 0.00),
    COUNT(*)
  INTO v_students, v_total_fee, v_total_students
  FROM student_roster r;

  RETURN jsonb_build_object(
    'school_id', p_school_id,
    'per_student_rate', v_rate,
    'total_students', v_total_students,
    'total_calculated_fee', v_total_fee,
    'billing_cycle', 'MONTHLY',
    'cycle_month', TO_CHAR(v_today, 'Month YYYY'),
    'students_breakdown', v_students
  );
END;
$$;

-- 4. Execute Monthly Subscription Billing (Allows Negative Balance)
CREATE OR REPLACE FUNCTION public.execute_monthly_subscription_billing(
  p_school_id UUID,
  p_performed_by_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_calc JSONB;
  v_fee NUMERIC(12, 2);
  v_student_count INTEGER;
  v_rate NUMERIC(10, 2);
  v_wallet_id UUID;
  v_old_balance NUMERIC(12, 2);
  v_new_balance NUMERIC(12, 2);
  v_ref_id TEXT;
  v_txn_id UUID;
  v_month_name TEXT;
BEGIN
  -- Run calculation
  v_calc := public.calculate_monthly_subscription(p_school_id);
  v_fee := (v_calc->>'total_calculated_fee')::NUMERIC;
  v_student_count := (v_calc->>'total_students')::INTEGER;
  v_rate := (v_calc->>'per_student_rate')::NUMERIC;
  v_month_name := TRIM(v_calc->>'cycle_month');

  IF v_fee <= 0 AND v_student_count = 0 THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'message', 'No active students to bill for this cycle.',
      'amount_debited', 0.00
    );
  END IF;

  -- Ensure Wallet
  SELECT id, balance INTO v_wallet_id, v_old_balance
  FROM public.school_wallets WHERE school_id = p_school_id FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    INSERT INTO public.school_wallets (school_id, balance)
    VALUES (p_school_id, 0.00)
    RETURNING id, balance INTO v_wallet_id, v_old_balance;
  END IF;

  -- Debit fee (allowed to become negative)
  v_new_balance := v_old_balance - v_fee;
  v_ref_id := 'SUB-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  UPDATE public.school_wallets
  SET balance = v_new_balance, updated_at = NOW()
  WHERE id = v_wallet_id;

  -- Record Ledger Entry
  INSERT INTO public.wallet_transactions (
    school_id, wallet_id, amount, transaction_type, category, balance_after,
    reference_id, description, student_count, performed_by_id, metadata
  ) VALUES (
    p_school_id, v_wallet_id, -v_fee, 'DEBIT', 'SUBSCRIPTION_FEE', v_new_balance,
    v_ref_id,
    'SaaS Subscription for ' || v_month_name || ' (' || v_student_count || ' Students @ ₹' || v_rate || '/mo)',
    v_student_count, p_performed_by_id, v_calc
  )
  RETURNING id INTO v_txn_id;

  -- Update Next Billing Date in Subscriptions
  UPDATE public.school_subscriptions
  SET last_billed_date = CURRENT_DATE,
      next_billing_date = (CURRENT_DATE + INTERVAL '1 month')::DATE,
      updated_at = NOW()
  WHERE school_id = p_school_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'transaction_id', v_txn_id,
    'reference_id', v_ref_id,
    'amount_debited', v_fee,
    'student_count', v_student_count,
    'old_balance', v_old_balance,
    'new_balance', v_new_balance,
    'cycle_month', v_month_name
  );
END;
$$;

-- 5. Update School Subscription Rate & Credit Adjustment (Super Admin)
CREATE OR REPLACE FUNCTION public.update_school_subscription_rate(
  p_school_id UUID,
  p_per_student_fee NUMERIC,
  p_wallet_adjustment NUMERIC DEFAULT 0.00,
  p_adjustment_reason TEXT DEFAULT 'Super Admin Rate Adjustment',
  p_performed_by_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_old_balance NUMERIC(12, 2);
  v_new_balance NUMERIC(12, 2);
  v_ref_id TEXT;
BEGIN
  IF p_per_student_fee <= 0 THEN
    RAISE EXCEPTION 'Per-student fee must be greater than zero.';
  END IF;

  -- Upsert Subscription Rate
  INSERT INTO public.school_subscriptions (school_id, per_student_fee)
  VALUES (p_school_id, p_per_student_fee)
  ON CONFLICT (school_id)
  DO UPDATE SET per_student_fee = EXCLUDED.per_student_fee, updated_at = NOW();

  -- Apply optional wallet adjustment if provided
  IF p_wallet_adjustment != 0 THEN
    SELECT id, balance INTO v_wallet_id, v_old_balance
    FROM public.school_wallets WHERE school_id = p_school_id FOR UPDATE;

    IF v_wallet_id IS NULL THEN
      INSERT INTO public.school_wallets (school_id, balance)
      VALUES (p_school_id, 0.00)
      RETURNING id, balance INTO v_wallet_id, v_old_balance;
    END IF;

    v_new_balance := v_old_balance + p_wallet_adjustment;
    v_ref_id := 'ADJ-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    UPDATE public.school_wallets
    SET balance = v_new_balance, updated_at = NOW()
    WHERE id = v_wallet_id;

    INSERT INTO public.wallet_transactions (
      school_id, wallet_id, amount, transaction_type, category, balance_after,
      reference_id, description, payment_method, performed_by_id
    ) VALUES (
      p_school_id, v_wallet_id, p_wallet_adjustment,
      CASE WHEN p_wallet_adjustment > 0 THEN 'CREDIT' ELSE 'DEBIT' END,
      'ADJUSTMENT', v_new_balance, v_ref_id, p_adjustment_reason, 'SUPER_ADMIN', p_performed_by_id
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'school_id', p_school_id,
    'new_rate', p_per_student_fee
  );
END;
$$;

-- Grant execute permissions to API roles
GRANT EXECUTE ON FUNCTION public.get_school_subscription_details(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.top_up_school_wallet(UUID, NUMERIC, TEXT, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_monthly_subscription(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_monthly_subscription_billing(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_school_subscription_rate(UUID, NUMERIC, NUMERIC, TEXT, UUID) TO anon, authenticated;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';

