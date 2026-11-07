-- ==============================================================================
-- SchoolSense — Student Fee Surplus & Advance Refund System
-- Allows schools to issue refunds for surplus/advance credit balances (e.g. after scholarship
-- concessions or overpayments).
-- ENFORCES: Refunds can ONLY be issued up to the available surplus/advance balance.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLE: student_fee_refunds
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_fee_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  voucher_number VARCHAR(100) NOT NULL UNIQUE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  refund_mode VARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER',
  transaction_reference VARCHAR(100),
  reason TEXT NOT NULL,
  refund_date DATE NOT NULL DEFAULT CURRENT_DATE,
  processed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  processed_by_name VARCHAR(150),
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_student_fee_refunds_school ON public.student_fee_refunds(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_refunds_year ON public.student_fee_refunds(school_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_refunds_voucher ON public.student_fee_refunds(voucher_number);

-- ------------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.student_fee_refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_student_fee_refunds_tenant ON public.student_fee_refunds;
CREATE POLICY p_student_fee_refunds_tenant ON public.student_fee_refunds
  FOR ALL
  TO authenticated, anon
  USING (
    public.is_platform_admin() OR
    (school_id = public.current_school_id() AND (
      public.is_staff_role() OR
      public.parent_can_access_student(student_id)
    ))
  )
  WITH CHECK (
    public.is_platform_admin() OR
    (school_id = public.current_school_id() AND public.is_staff_role())
  );

-- ------------------------------------------------------------------------------
-- 3. UNPRIVILEGED WORKHORSE: _issue_student_fee_refund_unsafe
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public._issue_student_fee_refund_unsafe(UUID, UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public._issue_student_fee_refund_unsafe(
  p_school_id UUID,
  p_user_id UUID,
  p_student_id UUID,
  p_amount NUMERIC,
  p_refund_mode TEXT,
  p_transaction_reference TEXT,
  p_reason TEXT,
  p_academic_year_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_student RECORD;
  v_user_rec RECORD;
  v_year RECORD;
  v_total_billed NUMERIC(10, 2) := 0.00;
  v_total_paid NUMERIC(10, 2) := 0.00;
  v_total_discount NUMERIC(10, 2) := 0.00;
  v_total_refunded NUMERIC(10, 2) := 0.00;
  v_available_advance NUMERIC(10, 2) := 0.00;
  v_remaining_advance NUMERIC(10, 2) := 0.00;
  v_voucher_number VARCHAR(100);
  v_refund_id UUID;
  v_payment_time TIMESTAMPTZ := NOW();
BEGIN
  -- Validate student exists in this school
  SELECT id, first_name, last_name, admission_number
    INTO v_student
    FROM public.students
   WHERE id = p_student_id AND school_id = p_school_id;

  IF v_student.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found', 'message', 'Student not found.');
  END IF;

  -- Resolve Academic Year
  SELECT id, name INTO v_year
    FROM public.academic_years
   WHERE school_id = p_school_id
     AND (p_academic_year_id IS NULL AND is_current = TRUE OR id = p_academic_year_id)
   LIMIT 1;

  IF v_year.id IS NULL THEN
    SELECT id, name INTO v_year
      FROM public.academic_years
     WHERE school_id = p_school_id
     ORDER BY created_at DESC LIMIT 1;
  END IF;

  -- 1. Calculate Authoritative Live Advance Balance
  -- Billed from Invoices
  SELECT COALESCE(SUM(total_amount), 0.00),
         COALESCE(SUM(discount_amount), 0.00)
    INTO v_total_billed, v_total_discount
    FROM public.student_fee_invoices
   WHERE school_id = p_school_id
     AND student_id = p_student_id
     AND (v_year.id IS NULL OR academic_year_id = v_year.id)
     AND deleted_at IS NULL;

  -- Additional charges
  SELECT v_total_billed + COALESCE(SUM(amount), 0.00)
    INTO v_total_billed
    FROM public.student_fee_additional_charges
   WHERE school_id = p_school_id
     AND student_id = p_student_id
     AND (v_year.id IS NULL OR academic_year_id = v_year.id)
     AND deleted_at IS NULL;

  -- Total payments collected
  SELECT COALESCE(SUM(amount_paid), 0.00)
    INTO v_total_paid
    FROM public.fee_payments
   WHERE school_id = p_school_id
     AND student_id = p_student_id
     AND (v_year.id IS NULL OR academic_year_id = v_year.id)
     AND deleted_at IS NULL;

  -- Previous refunds issued
  SELECT COALESCE(SUM(amount), 0.00)
    INTO v_total_refunded
    FROM public.student_fee_refunds
   WHERE school_id = p_school_id
     AND student_id = p_student_id
     AND (v_year.id IS NULL OR academic_year_id = v_year.id)
     AND deleted_at IS NULL;

  -- Invariant: Advance Credit = (Total Paid + Total Discount) - (Total Billed + Total Refunded)
  v_available_advance := GREATEST(0.00, (v_total_paid + v_total_discount) - (v_total_billed + v_total_refunded));

  IF v_available_advance <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_advance_balance',
      'available_advance', 0.00,
      'message', 'Student does not have any surplus advance credit. Refunds are only allowed for surplus or advance balances.'
    );
  END IF;

  IF p_amount > v_available_advance THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'amount_exceeds_advance',
      'available_advance', v_available_advance,
      'message', format('Refund amount (₹%s) exceeds available surplus advance credit (₹%s).', p_amount, v_available_advance)
    );
  END IF;

  -- 2. Generate unique refund voucher: REF-YYYYMM-XXXX
  v_voucher_number := 'REF-' || to_char(v_payment_time, 'YYYYMM') || '-' || upper(substring(gen_random_uuid()::text, 1, 6));

  -- Get processor name
  SELECT first_name, last_name INTO v_user_rec FROM public.users WHERE id = p_user_id;

  -- 3. Insert into student_fee_refunds
  INSERT INTO public.student_fee_refunds (
    school_id,
    student_id,
    academic_year_id,
    voucher_number,
    amount,
    refund_mode,
    transaction_reference,
    reason,
    refund_date,
    processed_by_user_id,
    processed_by_name,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_school_id,
    p_student_id,
    v_year.id,
    v_voucher_number,
    p_amount,
    COALESCE(NULLIF(UPPER(p_refund_mode), ''), 'BANK_TRANSFER'),
    p_transaction_reference,
    COALESCE(NULLIF(TRIM(p_reason), ''), 'Surplus advance fee refund'),
    v_payment_time::DATE,
    p_user_id,
    TRIM(COALESCE(v_user_rec.first_name, '') || ' ' || COALESCE(v_user_rec.last_name, 'Cashier')),
    'COMPLETED',
    v_payment_time,
    v_payment_time
  ) RETURNING id INTO v_refund_id;

  v_remaining_advance := v_available_advance - p_amount;

  RETURN jsonb_build_object(
    'success', true,
    'refund_id', v_refund_id,
    'voucher_number', v_voucher_number,
    'voucherNumber', v_voucher_number,
    'amount_refunded', p_amount,
    'amountRefunded', p_amount,
    'remaining_advance', v_remaining_advance,
    'remainingAdvance', v_remaining_advance,
    'refund_date', to_char(v_payment_time, 'YYYY-MM-DD'),
    'refund_mode', COALESCE(NULLIF(UPPER(p_refund_mode), ''), 'BANK_TRANSFER'),
    'student_name', TRIM(v_student.first_name || ' ' || COALESCE(v_student.last_name, '')),
    'admission_number', v_student.admission_number,
    'message', format('Refund of ₹%s issued successfully. Voucher: %s', p_amount, v_voucher_number)
  );
END;
$$;

REVOKE ALL ON FUNCTION public._issue_student_fee_refund_unsafe(UUID, UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, UUID) FROM public, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 4. PUBLIC SECURED WRAPPER: issue_student_fee_refund
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.issue_student_fee_refund(UUID, NUMERIC, TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.issue_student_fee_refund(
  p_student_id UUID,
  p_amount NUMERIC,
  p_refund_mode TEXT DEFAULT 'BANK_TRANSFER',
  p_transaction_reference TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT 'Surplus advance fee refund',
  p_academic_year_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sess JSONB := public.current_session();
  v_role TEXT;
  v_school_id UUID;
  v_user_id UUID;
BEGIN
  IF v_sess IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required', 'message', 'Active authenticated session required.');
  END IF;

  v_role := public.current_app_role();
  IF v_role NOT IN ('SCHOOL_ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'PLATFORM_ADMIN', 'FEE_MANAGER') THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden', 'message', 'Only school administrators and fee managers can issue refunds.');
  END IF;

  v_school_id := public.current_school_id();
  v_user_id := public.current_user_id();

  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Tenant context missing.');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount', 'message', 'Refund amount must be greater than zero.');
  END IF;

  RETURN public._issue_student_fee_refund_unsafe(
    v_school_id,
    v_user_id,
    p_student_id,
    p_amount,
    p_refund_mode,
    p_transaction_reference,
    p_reason,
    p_academic_year_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_student_fee_refund(UUID, NUMERIC, TEXT, TEXT, TEXT, UUID) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
