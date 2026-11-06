-- ==============================================================================
-- MIGRATION: FIX STUDENT FEE LEDGER AND SESSION SCHEDULE RPCs
-- Description:
--   1. Removes invalid `se.school_id = v_school_id` references from
--      `public.generate_student_session_schedule` and `public.get_student_fee_ledger`.
--      (The student_enrollments table does not have a school_id column;
--      school tenant scoping is strictly on `students st/s.school_id = v_school_id`).
--   2. Ensures passbook ledger entries resolve realistic chronological dates
--      (mapped to month start, capped at CURRENT_DATE) rather than future due dates.
--   3. Idempotent script safe to run directly against PostgreSQL / Supabase.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. RE-DEFINE public.generate_student_session_schedule
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

  -- Resolve Active Enrollment & Class (Corrected: student_enrollments has no school_id)
  SELECT se.class_id, c.name AS class_name
    INTO v_enr
    FROM public.students st
    LEFT JOIN LATERAL (
      SELECT se.class_id
        FROM public.student_enrollments se
       WHERE se.student_id = st.id
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
  -- ----------------------------------------------------------------------------
  IF v_frequency = 'MONTHLY' THEN
    FOR m IN 0..11 LOOP
      v_period_start := (v_session_start + (m || ' month')::INTERVAL)::DATE;
      
      IF v_period_start > CURRENT_DATE OR v_period_start > v_session_end THEN
        EXIT;
      END IF;

      v_period_name := to_char(v_period_start, 'FMMonth YYYY');

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
  -- ----------------------------------------------------------------------------
  ELSIF v_frequency = 'QUARTERLY' THEN
    FOR q IN 0..3 LOOP
      v_period_start := (v_session_start + ((q * 3) || ' month')::INTERVAL)::DATE;

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
-- 2. RE-DEFINE public.get_student_fee_ledger
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

  -- Resolve Student with Active Enrollment (Corrected: student_enrollments has no school_id)
  SELECT s.id, TRIM(s.first_name || ' ' || COALESCE(s.last_name, '')) AS student_name,
         s.admission_number, COALESCE(c.name, 'Class') AS class_name, COALESCE(sec.name, 'Section A') AS section_name
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

  -- Check if session schedule needs generation (if student has active enrollment but 0 active invoices)
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
      SELECT id, due_date, status, total_amount, paid_amount, fine_amount
        FROM public.student_fee_invoices
       WHERE school_id = v_school_id
         AND student_id = p_student_id
         AND academic_year_id = v_year.id
         AND status != 'PAID'
         AND paid_amount < total_amount
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
           'fine_amount', inv.fine_amount,
           'due_date', inv.due_date,
           'status', inv.status,
           'items', inv.items,
           'created_at', inv.created_at
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
    -- 4. Fee Payments
    SELECT LEAST(CURRENT_DATE, COALESCE(p.payment_date, p.created_at::DATE, CURRENT_DATE)) AS entry_date,
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
