-- ==============================================================================
-- SchoolSense — Fee Concessions & Ledger Integration
-- Ensures fee concessions/coupons applied at cashier desk are:
-- 1. Recorded atomically on student_fee_invoices and fee_payments with coupon code
-- 2. Fully reflected in student ledger passbook as credit entries under the coupon code
-- 3. Accurately settling invoices so zero undue balance remains
-- ==============================================================================

-- 1. Schema Upgrades for Invoices & Payments Tables
ALTER TABLE public.student_fee_invoices 
  ADD COLUMN IF NOT EXISTS discount_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50);

ALTER TABLE public.fee_payments 
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS discount_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_fee_invoices_discount_code ON public.student_fee_invoices(school_id, discount_code);
CREATE INDEX IF NOT EXISTS idx_fee_payments_discount_code ON public.fee_payments(school_id, discount_code);

-- ------------------------------------------------------------------------------
-- 2. Atomic Fee Payment Collection with Concession & Promocode Support
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public._collect_fee_payment_unsafe(UUID, UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT);
DROP FUNCTION IF EXISTS public._collect_fee_payment_unsafe(UUID, UUID, UUID, NUMERIC, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.collect_fee_payment(UUID, NUMERIC, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.collect_fee_payment(UUID, NUMERIC, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public._collect_fee_payment_unsafe(
  p_school_id UUID,
  p_user_id UUID,
  p_invoice_id UUID,
  p_amount NUMERIC,
  p_payment_mode TEXT,
  p_transaction_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT 0.00,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_invoice RECORD;
  v_user_rec RECORD;
  v_existing_settled NUMERIC(10, 2);
  v_remaining NUMERIC(10, 2);
  v_applied_discount NUMERIC(10, 2) := 0.00;
  v_payable_after_discount NUMERIC(10, 2) := 0.00;
  v_new_paid NUMERIC(10, 2);
  v_new_discount NUMERIC(10, 2);
  v_new_status VARCHAR(20);
  v_receipt_number VARCHAR(100);
  v_payment_id UUID;
  v_payment_time TIMESTAMPTZ := clock_timestamp();
  v_clean_code VARCHAR(100);
  v_clean_type VARCHAR(50);
BEGIN
  -- 1. Validate Payment Amount & Discount
  IF (p_amount IS NULL OR p_amount < 0) AND (p_discount_amount IS NULL OR p_discount_amount <= 0) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_payment_amount', 'message', 'Please enter a valid payment amount or concession.');
  END IF;

  v_clean_code := NULLIF(TRIM(p_discount_code), '');
  v_clean_type := COALESCE(NULLIF(TRIM(p_discount_type), ''), CASE WHEN v_clean_code IS NOT NULL THEN 'PROMOCODE' ELSE NULL END);

  -- 2. Concurrency Lock on Invoice
  SELECT id, school_id, academic_year_id, student_id, invoice_number, total_amount, paid_amount, discount_amount, discount_code, discount_type, status
    INTO v_invoice
    FROM public.student_fee_invoices
   WHERE id = p_invoice_id
     AND school_id = p_school_id
     AND deleted_at IS NULL
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invoice_not_found', 'message', 'Selected invoice not found.');
  END IF;

  -- 3. Check remaining due considering existing paid + existing discount
  v_existing_settled := COALESCE(v_invoice.paid_amount, 0.00) + COALESCE(v_invoice.discount_amount, 0.00);
  v_remaining := GREATEST(0.00, v_invoice.total_amount - v_existing_settled);

  IF v_remaining <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invoice_already_fully_paid', 'message', 'This invoice has already been fully settled.');
  END IF;

  -- Calculate discount safely (capped at remaining due)
  IF p_discount_amount IS NOT NULL AND p_discount_amount > 0 THEN
    v_applied_discount := LEAST(p_discount_amount, v_remaining);
  ELSE
    v_applied_discount := 0.00;
  END IF;

  v_payable_after_discount := v_remaining - v_applied_discount;

  -- Validate actual payment cash/UPI amount does not exceed payable
  IF p_amount > v_payable_after_discount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'amount_exceeds_due',
      'remaining_due', v_payable_after_discount,
      'applied_discount', v_applied_discount,
      'message', format('Payment amount (₹%s) exceeds payable amount (₹%s) after discount.', p_amount, v_payable_after_discount)
    );
  END IF;

  -- 4. Compute updated figures
  v_new_paid := COALESCE(v_invoice.paid_amount, 0.00) + COALESCE(p_amount, 0.00);
  v_new_discount := COALESCE(v_invoice.discount_amount, 0.00) + v_applied_discount;

  IF (v_new_paid + v_new_discount) >= v_invoice.total_amount THEN
    v_new_status := 'PAID';
  ELSE
    v_new_status := 'PARTIAL';
  END IF;

  -- 5. Generate Receipt Number: REC-YYYYMM-XXXX
  v_receipt_number := 'REC-' || to_char(v_payment_time, 'YYYYMM') || '-' || upper(substring(gen_random_uuid()::text, 1, 6));

  -- Get Collector Name
  SELECT first_name, last_name INTO v_user_rec FROM public.users WHERE id = p_user_id;

  -- 6. Insert into fee_payments
  INSERT INTO public.fee_payments (
    school_id,
    academic_year_id,
    invoice_id,
    student_id,
    receipt_number,
    amount_paid,
    payment_mode,
    payment_date,
    transaction_reference,
    collected_by_user_id,
    collected_by_name,
    remarks,
    discount_amount,
    discount_code,
    discount_type,
    created_at,
    updated_at
  ) VALUES (
    p_school_id,
    v_invoice.academic_year_id,
    v_invoice.id,
    v_invoice.student_id,
    v_receipt_number,
    COALESCE(p_amount, 0.00),
    COALESCE(NULLIF(UPPER(p_payment_mode), ''), 'CASH'),
    v_payment_time::DATE,
    p_transaction_reference,
    p_user_id,
    TRIM(COALESCE(v_user_rec.first_name, '') || ' ' || COALESCE(v_user_rec.last_name, '')),
    p_notes,
    v_applied_discount,
    v_clean_code,
    v_clean_type,
    v_payment_time,
    v_payment_time
  ) RETURNING id INTO v_payment_id;

  -- 7. Update Student Fee Invoice
  UPDATE public.student_fee_invoices
     SET paid_amount = v_new_paid,
         discount_amount = v_new_discount,
         discount_code = COALESCE(v_clean_code, v_invoice.discount_code),
         discount_type = COALESCE(v_clean_type, v_invoice.discount_type),
         status = v_new_status,
         updated_at = v_payment_time
   WHERE id = v_invoice.id;

  -- 8. Increment promocode usage counter if coupon code was used
  IF v_clean_code IS NOT NULL THEN
    UPDATE public.fee_promocodes
       SET used_count = COALESCE(used_count, 0) + 1,
           updated_at = v_payment_time
     WHERE school_id = p_school_id
       AND UPPER(code) = UPPER(v_clean_code);
  END IF;

  -- 9. Audit Log Entry
  INSERT INTO public.audit_logs (
    school_id,
    user_id,
    action,
    entity,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    p_school_id,
    p_user_id,
    'FEE_PAYMENT_COLLECTED',
    'student_fee_invoices',
    v_invoice.id,
    jsonb_build_object(
      'paid_amount', v_invoice.paid_amount,
      'discount_amount', v_invoice.discount_amount,
      'status', v_invoice.status
    ),
    jsonb_build_object(
      'paid_amount', v_new_paid,
      'discount_amount', v_new_discount,
      'discount_code', v_clean_code,
      'status', v_new_status,
      'payment_id', v_payment_id,
      'receipt', v_receipt_number
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', v_invoice.id,
    'receipt_number', v_receipt_number,
    'amount_paid', COALESCE(p_amount, 0.00),
    'discount_amount', v_applied_discount,
    'discount_code', v_clean_code,
    'total_settled', v_new_paid + v_new_discount,
    'remaining_due', GREATEST(0.00, v_invoice.total_amount - (v_new_paid + v_new_discount)),
    'status', v_new_status,
    'paid_at', to_char(v_payment_time, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'message', CASE 
      WHEN v_applied_discount > 0 THEN format('Payment of ₹%s with discount ₹%s (Coupon: %s) recorded successfully.', p_amount, v_applied_discount, COALESCE(v_clean_code, 'APPLIED'))
      ELSE format('Payment of ₹%s recorded successfully.', p_amount)
    END
  );
END;
$$;

REVOKE ALL ON FUNCTION public._collect_fee_payment_unsafe(UUID, UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM public, anon, authenticated;

-- Public Session-Guarded Wrapper for collect_fee_payment
CREATE OR REPLACE FUNCTION public.collect_fee_payment(
  p_invoice_id UUID,
  p_amount NUMERIC,
  p_payment_mode TEXT,
  p_transaction_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT 0.00,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sess JSONB := public.current_session();
  v_role TEXT;
BEGIN
  IF v_sess IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required', 'message', 'Valid user session required');
  END IF;

  v_role := public.current_app_role();
  IF v_role NOT IN ('SUPER_ADMIN', 'PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'FEE_MANAGER') THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized_fee_collection', 'message', 'Role unauthorized to collect fees');
  END IF;

  RETURN public._collect_fee_payment_unsafe(
    public.current_school_id(),
    public.current_user_id(),
    p_invoice_id,
    p_amount,
    p_payment_mode,
    p_transaction_reference,
    p_notes,
    p_discount_amount,
    p_discount_type,
    p_discount_code
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.collect_fee_payment(UUID, NUMERIC, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 3. RE-DEFINE public.get_student_fee_ledger WITH CONCESSION / COUPON PASSBOOK ENTRIES
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
  inv_rec RECORD;
  v_days_overdue INT := 0;
  v_fine_calc NUMERIC(10, 2) := 0.00;
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
         s.admission_number, COALESCE(c.name, 'Class') AS class_name, COALESCE(sec.name, 'Section A') AS section_name,
         s.photo_url
    INTO v_student
    FROM public.students s
    LEFT JOIN LATERAL (
      SELECT se.class_id, se.section_id
        FROM public.student_enrollments se
       WHERE se.student_id = s.id 
         AND (v_year.id IS NULL OR se.academic_year_id = v_year.id)
       ORDER BY se.created_at DESC LIMIT 1
    ) enr ON TRUE
    LEFT JOIN public.classes c ON c.id = enr.class_id
    LEFT JOIN public.sections sec ON sec.id = enr.section_id
   WHERE s.id = p_student_id AND s.school_id = v_school_id;

  IF v_student.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'student_not_found');
  END IF;

  -- Check if session schedule needs generation
  SELECT COUNT(*) INTO v_invoice_count
    FROM public.student_fee_invoices
   WHERE school_id = v_school_id
     AND student_id = p_student_id
     AND academic_year_id = v_year.id
     AND deleted_at IS NULL;

  IF v_invoice_count = 0 THEN
    PERFORM public.generate_student_session_schedule(p_student_id, v_year.id);
  END IF;

  -- Load Student Preference
  SELECT frequency, annual_concession_pct, notes
    INTO v_pref
    FROM public.student_fee_preferences
   WHERE school_id = v_school_id
     AND student_id = p_student_id
     AND academic_year_id = v_year.id
   LIMIT 1;

  -- Load School Fee Rules
  SELECT * INTO v_rules
    FROM public.school_fee_rules
   WHERE school_id = v_school_id
     AND academic_year_id = v_year.id
   LIMIT 1;

  -- Dynamically evaluate late fees on overdue invoices
  IF COALESCE(v_rules.enable_late_fee, FALSE) = TRUE THEN
    FOR inv_rec IN (
      SELECT id, due_date, status, total_amount, paid_amount, discount_amount, fine_amount
        FROM public.student_fee_invoices
       WHERE school_id = v_school_id
         AND student_id = p_student_id
         AND academic_year_id = v_year.id
         AND status != 'PAID'
         AND (COALESCE(paid_amount, 0.00) + COALESCE(discount_amount, 0.00)) < total_amount
         AND due_date IS NOT NULL
         AND CURRENT_DATE > (due_date + COALESCE(v_rules.grace_period_days, 5))
         AND deleted_at IS NULL
    ) LOOP
      IF UPPER(COALESCE(v_rules.late_fee_type, 'FLAT')) = 'DAILY' THEN
        v_days_overdue := GREATEST(1, CURRENT_DATE - (inv_rec.due_date + COALESCE(v_rules.grace_period_days, 5)));
        v_fine_calc := v_days_overdue * COALESCE(v_rules.late_fee_amount, 0.00);
      ELSE
        v_fine_calc := COALESCE(v_rules.late_fee_amount, 0.00);
      END IF;

      IF v_fine_calc != COALESCE(inv_rec.fine_amount, 0.00) THEN
        UPDATE public.student_fee_invoices
           SET fine_amount = v_fine_calc,
               status = 'OVERDUE',
               updated_at = NOW()
         WHERE id = inv_rec.id;
      END IF;
    END LOOP;
  END IF;

  -- Load Invoices
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', inv.id,
           'invoice_number', inv.invoice_number,
           'month_name', inv.month_name,
           'total_amount', inv.total_amount,
           'paid_amount', inv.paid_amount,
           'discount_amount', inv.discount_amount,
           'discount_code', inv.discount_code,
           'discount_type', inv.discount_type,
           'fine_amount', inv.fine_amount,
           'due_date', inv.due_date,
           'status', inv.status,
           'items', inv.items,
           'created_at', inv.created_at,
           'updated_at', inv.updated_at
         ) ORDER BY inv.due_date ASC), '[]'::JSONB),
         COALESCE(SUM(inv.total_amount), 0.00),
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
           'discount_amount', p.discount_amount,
           'discount_code', p.discount_code,
           'discount_type', p.discount_type,
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
  v_total_billed := 0.00;
  v_total_paid := 0.00;
  v_total_discount := 0.00;
  v_running_balance := 0.00;

  FOR r IN (
    -- 1. Base Tuition Invoices (Mapped to session month start, never future dates)
    SELECT LEAST(CURRENT_DATE, COALESCE(
             CASE
                WHEN inv.month_name ~* 'April' THEN make_date(COALESCE(NULLIF(substring(v_year.name from '^([0-9]{4})'), '')::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT), 4, 1)
                WHEN inv.month_name ~* 'May' THEN make_date(COALESCE(NULLIF(substring(v_year.name from '^([0-9]{4})'), '')::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT), 5, 1)
                WHEN inv.month_name ~* 'June' THEN make_date(COALESCE(NULLIF(substring(v_year.name from '^([0-9]{4})'), '')::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT), 6, 1)
                WHEN inv.month_name ~* 'July' THEN make_date(COALESCE(NULLIF(substring(v_year.name from '^([0-9]{4})'), '')::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT), 7, 1)
                WHEN inv.month_name ~* 'August' THEN make_date(COALESCE(NULLIF(substring(v_year.name from '^([0-9]{4})'), '')::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT), 8, 1)
                WHEN inv.month_name ~* 'September' THEN make_date(COALESCE(NULLIF(substring(v_year.name from '^([0-9]{4})'), '')::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT), 9, 1)
                WHEN inv.month_name ~* 'October' THEN make_date(COALESCE(NULLIF(substring(v_year.name from '^([0-9]{4})'), '')::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT), 10, 1)
                WHEN inv.month_name ~* 'November' THEN make_date(COALESCE(NULLIF(substring(v_year.name from '^([0-9]{4})'), '')::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT), 11, 1)
                WHEN inv.month_name ~* 'December' THEN make_date(COALESCE(NULLIF(substring(v_year.name from '^([0-9]{4})'), '')::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT), 12, 1)
                WHEN inv.month_name ~* 'January' THEN make_date(COALESCE(NULLIF(substring(v_year.name from '^([0-9]{4})'), '')::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT) + 1, 1, 1)
                WHEN inv.month_name ~* 'February' THEN make_date(COALESCE(NULLIF(substring(v_year.name from '^([0-9]{4})'), '')::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT) + 1, 2, 1)
                WHEN inv.month_name ~* 'March' THEN make_date(COALESCE(NULLIF(substring(v_year.name from '^([0-9]{4})'), '')::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT) + 1, 3, 1)
                ELSE inv.due_date
             END,
             inv.due_date,
             inv.created_at::DATE,
             CURRENT_DATE
           )) AS entry_date,
           'INVOICE' AS entry_type,
           inv.invoice_number AS ref_no,
           'Fee Invoice: ' || COALESCE(inv.month_name, to_char(inv.due_date, 'Mon YYYY')) AS descr,
           inv.total_amount AS debit_amt,
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
    -- 2. Late Fee Fines (Dedicated debit row on the day overdue fine begins)
    SELECT LEAST(CURRENT_DATE, (inv.due_date + COALESCE(v_rules.grace_period_days, 5) + 1)::DATE) AS entry_date,
           'CHARGE' AS entry_type,
           'FINE-' || inv.invoice_number AS ref_no,
           CASE
             WHEN UPPER(COALESCE(v_rules.late_fee_type, 'FLAT')) = 'DAILY' THEN
               'Late Fee Fine (' || GREATEST(1, CURRENT_DATE - (inv.due_date + COALESCE(v_rules.grace_period_days, 5))) || ' days overdue @ ₹' || COALESCE(v_rules.late_fee_amount, 0.00) || '/day)'
             ELSE
               'Late Fee Fine (Flat overdue penalty for ' || COALESCE(inv.month_name, to_char(inv.due_date, 'Mon YYYY')) || ')'
           END AS descr,
           inv.fine_amount AS debit_amt,
           0.00 AS credit_amt,
           'OVERDUE' AS item_status,
           NULL::VARCHAR AS pay_mode,
           1 AS sort_prio,
           inv.created_at + INTERVAL '1 second' AS created_at
      FROM public.student_fee_invoices inv
     WHERE inv.school_id = v_school_id
       AND inv.student_id = p_student_id
       AND inv.academic_year_id = v_year.id
       AND inv.deleted_at IS NULL
       AND COALESCE(inv.fine_amount, 0.00) > 0
    UNION ALL
    -- 3. Additional Charges
    SELECT LEAST(CURRENT_DATE, COALESCE(chg.created_at::DATE, chg.effective_date, CURRENT_DATE)) AS entry_date,
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
    -- 4. Concessions & Promocode Discounts Applied Under Coupon Code
    SELECT LEAST(CURRENT_DATE, COALESCE(inv.updated_at::DATE, inv.created_at::DATE, CURRENT_DATE)) AS entry_date,
           'CONCESSION' AS entry_type,
           COALESCE(NULLIF(TRIM(inv.discount_code), ''), 'CONCESSION') AS ref_no,
           CASE
             WHEN inv.discount_code IS NOT NULL AND TRIM(inv.discount_code) != ''
               THEN 'Fee Concession / Discount Applied (Coupon: ' || TRIM(inv.discount_code) || ')'
             WHEN inv.discount_type IS NOT NULL AND TRIM(inv.discount_type) != ''
               THEN 'Fee Concession (' || TRIM(inv.discount_type) || ')'
             ELSE 'Fee Concession / Discount Applied'
           END AS descr,
           0.00 AS debit_amt,
           inv.discount_amount AS credit_amt,
           'APPLIED' AS item_status,
           'CONCESSION' AS pay_mode,
           2 AS sort_prio,
           inv.updated_at AS created_at
      FROM public.student_fee_invoices inv
     WHERE inv.school_id = v_school_id
       AND inv.student_id = p_student_id
       AND inv.academic_year_id = v_year.id
       AND inv.deleted_at IS NULL
       AND COALESCE(inv.discount_amount, 0.00) > 0
    UNION ALL
    -- 5. Fee Payments
    SELECT LEAST(CURRENT_DATE, COALESCE(p.payment_date, p.created_at::DATE, CURRENT_DATE)) AS entry_date,
           'PAYMENT' AS entry_type,
           p.receipt_number AS ref_no,
           'Payment Received (' || p.payment_mode || COALESCE(' - ' || NULLIF(p.transaction_reference, ''), '') || ')' AS descr,
           0.00 AS debit_amt,
           p.amount_paid AS credit_amt,
           'PAID' AS item_status,
           p.payment_mode AS pay_mode,
           3 AS sort_prio,
           p.created_at
      FROM public.fee_payments p
     WHERE p.school_id = v_school_id
       AND p.student_id = p_student_id
       AND (p.academic_year_id IS NULL OR p.academic_year_id = v_year.id)
       AND p.deleted_at IS NULL
     ORDER BY entry_date ASC, sort_prio ASC, created_at ASC
  ) LOOP
    v_total_billed := v_total_billed + r.debit_amt;
    IF r.entry_type = 'CONCESSION' THEN
      v_total_discount := v_total_discount + r.credit_amt;
    ELSIF r.entry_type = 'PAYMENT' THEN
      v_total_paid := v_total_paid + r.credit_amt;
    END IF;
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

  v_advance_balance := GREATEST(0.00, (v_total_paid + v_total_discount) - v_total_billed);
  v_pending_due := GREATEST(0.00, v_total_billed - (v_total_paid + v_total_discount));

  RETURN jsonb_build_object(
    'success', true,
    'studentId', v_student.id,
    'studentName', v_student.student_name,
    'admissionNumber', v_student.admission_number,
    'className', v_student.class_name,
    'sectionName', v_student.section_name,
    'photo_url', v_student.photo_url,
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
    'netBilled', GREATEST(0.00, v_total_billed - v_total_discount),
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
