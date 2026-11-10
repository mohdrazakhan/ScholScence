-- ==============================================================================
-- SchoolSense — Frontend Optimization & Operational RPCs
-- ==============================================================================
-- Functions implemented:
-- 1. get_dashboard_overview: Unified role-scoped single roundtrip dashboard
-- 2. get_attendance_monthly_register: Single-query monthly attendance matrix
-- 3. collect_fee_payment: Atomic fee invoice collection with row-level locking
-- 4. validate_timetable_conflict: Pre-flight teacher and section conflict check
--
-- Security Baseline:
-- - SECURITY DEFINER with pinned search_path = public, extensions
-- - Strict session validation via current_session()
-- - Zero client-trust: school_id, user_id, and role derived server-side
-- ==============================================================================

SET search_path = public, extensions;

-- ==============================================================================
-- 1. SUPPORTING PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_attendance_section_date_perf
  ON public.attendance(school_id, section_id, date);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_sec_status
  ON public.student_enrollments(school_id, section_id, academic_year_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_timetable_periods_teacher_slot
  ON public.timetable_periods(school_id, academic_year_id, teacher_id, day_of_week)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_timetable_periods_section_slot
  ON public.timetable_periods(school_id, academic_year_id, section_id, day_of_week)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_fee_invoices_school_session_status
  ON public.student_fee_invoices(school_id, academic_year_id, status)
  WHERE deleted_at IS NULL;


-- ==============================================================================
-- 2. get_dashboard_overview (Raw / Unsafe Implementation)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public._get_dashboard_overview_v2_unsafe(
  p_school_id UUID,
  p_academic_year_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_role TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id UUID := p_school_id;
  v_active_year_id UUID := p_academic_year_id;
  v_user_id UUID := p_user_id;
  v_role TEXT := UPPER(COALESCE(p_role, 'SCHOOL_ADMIN'));
  v_school_rec RECORD;
  v_year_rec RECORD;
  v_total_students INT := 0;
  v_active_students INT := 0;
  v_inactive_students INT := 0;
  v_total_classes INT := 0;
  v_total_sections INT := 0;
  v_total_subjects INT := 0;
  v_total_teachers INT := 0;
  v_total_staff INT := 0;
  v_today_date DATE := CURRENT_DATE;
  v_today_present INT := 0;
  v_today_absent INT := 0;
  v_today_late INT := 0;
  v_today_total_att INT := 0;
  v_today_classes_marked INT := 0;
  v_attendance_pct TEXT := '0.0%';
  v_pending_complaints INT := 0;
  v_total_collected NUMERIC(12, 2) := 0.00;
  v_pending_fees NUMERIC(12, 2) := 0.00;
  v_wallet_balance NUMERIC(12, 2) := 0.00;
  v_recent_notices JSONB := '[]'::JSONB;
  v_teacher_schedule JSONB := '[]'::JSONB;
  v_parent_children JSONB := '[]'::JSONB;
  v_dow_std INT := EXTRACT(DOW FROM CURRENT_DATE);
  v_result JSONB;
BEGIN
  -- 1. Validate School
  SELECT id, name, code, city, status, email, phone, logo_url
    INTO v_school_rec
    FROM public.schools
   WHERE id = v_school_id
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'school_not_found');
  END IF;

  -- 2. Resolve Academic Year
  IF v_active_year_id IS NULL THEN
    SELECT id, name, is_current
      INTO v_year_rec
      FROM public.academic_years
     WHERE school_id = v_school_id
       AND is_current = TRUE
       AND deleted_at IS NULL
     LIMIT 1;

    IF v_year_rec.id IS NOT NULL THEN
      v_active_year_id := v_year_rec.id;
    ELSE
      SELECT id, name, is_current
        INTO v_year_rec
        FROM public.academic_years
       WHERE school_id = v_school_id
         AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1;
      v_active_year_id := v_year_rec.id;
    END IF;
  ELSE
    SELECT id, name, is_current
      INTO v_year_rec
      FROM public.academic_years
     WHERE id = v_active_year_id AND school_id = v_school_id
     LIMIT 1;
  END IF;

  -- 3. Academic Counts
  SELECT COUNT(DISTINCT s.id) INTO v_total_students
    FROM public.students s
   WHERE s.school_id = v_school_id AND s.deleted_at IS NULL;

  IF v_active_year_id IS NOT NULL THEN
    SELECT
      COUNT(DISTINCT CASE WHEN se.status = 'ACTIVE' THEN se.student_id END),
      COUNT(DISTINCT CASE WHEN se.status != 'ACTIVE' THEN se.student_id END)
      INTO v_active_students, v_inactive_students
      FROM public.student_enrollments se
      JOIN public.students s ON s.id = se.student_id
     WHERE s.school_id = v_school_id
       AND se.academic_year_id = v_active_year_id
       AND se.deleted_at IS NULL
       AND s.deleted_at IS NULL;
  ELSE
    v_active_students := v_total_students;
    v_inactive_students := 0;
  END IF;

  SELECT COUNT(*) INTO v_total_classes
    FROM public.classes
   WHERE school_id = v_school_id AND deleted_at IS NULL;

  IF v_active_year_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_total_sections
      FROM public.sections
     WHERE school_id = v_school_id
       AND academic_year_id = v_active_year_id
       AND deleted_at IS NULL;
  ELSE
    SELECT COUNT(*) INTO v_total_sections
      FROM public.sections
     WHERE school_id = v_school_id AND deleted_at IS NULL;
  END IF;

  SELECT COUNT(*) INTO v_total_subjects
    FROM public.subjects
   WHERE school_id = v_school_id AND deleted_at IS NULL;

  -- 4. Staff & Teachers
  SELECT COUNT(DISTINCT usr.user_id) INTO v_total_teachers
    FROM public.user_school_roles usr
    JOIN public.roles r ON r.id = usr.role_id
   WHERE usr.school_id = v_school_id
     AND usr.status = 'ACTIVE'
     AND usr.deleted_at IS NULL
     AND r.code IN ('TEACHER', 'CLASS_TEACHER');

  SELECT COUNT(DISTINCT usr.user_id) INTO v_total_staff
    FROM public.user_school_roles usr
    JOIN public.roles r ON r.id = usr.role_id
   WHERE usr.school_id = v_school_id
     AND usr.status = 'ACTIVE'
     AND usr.deleted_at IS NULL
     AND r.code NOT IN ('STUDENT', 'GUARDIAN', 'PARENT');

  -- 5. Daily Attendance
  SELECT
    COUNT(CASE WHEN status = 'PRESENT' THEN 1 END),
    COUNT(CASE WHEN status = 'ABSENT' THEN 1 END),
    COUNT(CASE WHEN status = 'LATE' THEN 1 END),
    COUNT(*)
    INTO v_today_present, v_today_absent, v_today_late, v_today_total_att
    FROM public.attendance
   WHERE school_id = v_school_id AND date = v_today_date;

  SELECT COUNT(DISTINCT COALESCE(s.class_id, se.class_id))
    INTO v_today_classes_marked
    FROM public.attendance a
    LEFT JOIN public.sections s ON s.id = a.section_id
    LEFT JOIN public.student_enrollments se ON se.student_id = a.student_id
   WHERE a.school_id = v_school_id AND a.date = v_today_date;

  IF v_today_total_att > 0 THEN
    v_attendance_pct := ROUND(((v_today_present + v_today_late)::NUMERIC / v_today_total_att::NUMERIC) * 100, 1)::TEXT || '%';
  ELSE
    v_attendance_pct := '0.0%';
  END IF;

  -- 6. Complaints & Wallet
  SELECT COUNT(*) INTO v_pending_complaints
    FROM public.complaints
   WHERE school_id = v_school_id
     AND status IN ('OPEN', 'IN_PROGRESS', 'PENDING')
     AND deleted_at IS NULL;

  SELECT COALESCE(balance, 0.00) INTO v_wallet_balance
    FROM public.school_wallets
   WHERE school_id = v_school_id
   LIMIT 1;

  -- 7. Fees Summary
  IF v_active_year_id IS NOT NULL THEN
    SELECT
      COALESCE(SUM(paid_amount), 0.00),
      COALESCE(SUM(GREATEST(0, total_amount - paid_amount)), 0.00)
      INTO v_total_collected, v_pending_fees
      FROM public.student_fee_invoices
     WHERE school_id = v_school_id
       AND academic_year_id = v_active_year_id
       AND deleted_at IS NULL;
  END IF;

  -- 8. Notices
  SELECT COALESCE(jsonb_agg(n_sub), '[]'::JSONB)
    INTO v_recent_notices
    FROM (
      SELECT id, title, created_at, priority
        FROM public.notices
       WHERE school_id = v_school_id AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 5
    ) n_sub;

  -- 9. Role-Specific Data
  IF v_role IN ('TEACHER', 'CLASS_TEACHER') AND v_user_id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(t_sub), '[]'::JSONB)
      INTO v_teacher_schedule
      FROM (
        SELECT
          tp.id,
          tp.period_number,
          tp.start_time,
          tp.end_time,
          tp.room_number,
          s.name AS section_name,
          c.name AS class_name,
          sub.name AS subject_name
          FROM public.timetable_periods tp
          JOIN public.sections s ON s.id = tp.section_id
          JOIN public.classes c ON c.id = s.class_id
          JOIN public.subjects sub ON sub.id = tp.subject_id
         WHERE tp.school_id = v_school_id
           AND tp.teacher_id = v_user_id
           AND tp.day_of_week = v_dow_std
           AND (v_active_year_id IS NULL OR tp.academic_year_id = v_active_year_id)
           AND tp.deleted_at IS NULL
         ORDER BY tp.period_number ASC
      ) t_sub;
  ELSIF v_role IN ('GUARDIAN', 'PARENT') AND v_user_id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(p_sub), '[]'::JSONB)
      INTO v_parent_children
      FROM (
        SELECT
          st.id AS student_id,
          st.first_name,
          st.last_name,
          se.roll_number,
          c.name AS class_name,
          sec.name AS section_name
          FROM public.student_guardians sg
          JOIN public.guardians g ON g.id = sg.guardian_id
          JOIN public.students st ON st.id = sg.student_id
          LEFT JOIN public.student_enrollments se ON se.student_id = st.id
                AND (v_active_year_id IS NULL OR se.academic_year_id = v_active_year_id)
                AND se.deleted_at IS NULL
          LEFT JOIN public.classes c ON c.id = se.class_id
          LEFT JOIN public.sections sec ON sec.id = se.section_id
         WHERE g.user_id = v_user_id
           AND st.school_id = v_school_id
           AND st.deleted_at IS NULL
      ) p_sub;
  END IF;

  -- 10. Assemble Response JSON
  v_result := jsonb_build_object(
    'role', v_role,
    'stats', jsonb_build_object(
      'totalStudents', v_total_students,
      'activeStudents', v_active_students,
      'inactiveStudents', v_inactive_students,
      'totalClasses', v_total_classes,
      'totalSections', v_total_sections,
      'totalSubjects', v_total_subjects,
      'totalTeachers', v_total_teachers,
      'totalDepartmentalStaff', v_total_staff,
      'attendanceTodayPercentage', v_attendance_pct,
      'attendanceMarkedCount', v_today_total_att,
      'attendanceClassesMarkedCount', v_today_classes_marked,
      'attendancePresentCount', v_today_present,
      'attendanceAbsentCount', v_today_absent,
      'attendanceLateCount', v_today_late,
      'pendingComplaints', v_pending_complaints,
      'totalCollectedFees', v_total_collected,
      'pendingFees', v_pending_fees,
      'walletBalance', v_wallet_balance
    ),
    'campusInfo', jsonb_build_object(
      'id', v_school_rec.id,
      'name', v_school_rec.name,
      'code', v_school_rec.code,
      'city', v_school_rec.city
    ),
    'recentNotices', v_recent_notices,
    'roleSpecific', jsonb_build_object(
      'teacherScheduleToday', v_teacher_schedule,
      'parentChildrenOverview', v_parent_children
    )
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public._get_dashboard_overview_v2_unsafe(UUID, UUID, UUID, TEXT) FROM public, anon, authenticated;

-- Public Session-Guarded Wrapper for get_dashboard_overview
CREATE OR REPLACE FUNCTION public.get_dashboard_overview(
  p_academic_year_id UUID DEFAULT NULL,
  p_school_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_role TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sess JSONB := public.current_session();
  v_school_id UUID;
  v_user_id UUID;
  v_role TEXT;
BEGIN
  IF v_sess IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required');
  END IF;

  IF public.is_platform_admin() AND p_school_id IS NOT NULL THEN
    v_school_id := p_school_id;
  ELSE
    v_school_id := public.current_school_id();
  END IF;

  v_user_id := public.current_user_id();
  v_role := public.current_app_role();

  RETURN public._get_dashboard_overview_v2_unsafe(
    v_school_id,
    p_academic_year_id,
    v_user_id,
    v_role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_overview(UUID, UUID, UUID, TEXT) TO anon, authenticated, service_role;


-- ==============================================================================
-- 3. get_attendance_monthly_register (Single-Roundtrip Attendance Matrix)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public._get_attendance_monthly_register_unsafe(
  p_school_id UUID,
  p_section_id UUID,
  p_month INT,
  p_year INT,
  p_academic_year_id UUID DEFAULT NULL,
  p_caller_user_id UUID DEFAULT NULL,
  p_caller_role TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_section_rec RECORD;
  v_active_year_id UUID := p_academic_year_id;
  v_start_date DATE;
  v_end_date DATE;
  v_total_working_days INT := 0;
  v_students JSONB := '[]'::JSONB;
  v_is_parent BOOLEAN := (p_caller_role IN ('GUARDIAN', 'PARENT'));
BEGIN
  -- 1. Validate section & school ownership
  SELECT s.id, s.name AS section_name, c.name AS class_name, s.academic_year_id
    INTO v_section_rec
    FROM public.sections s
    JOIN public.classes c ON c.id = s.class_id
   WHERE s.id = p_section_id
     AND s.school_id = p_school_id
     AND s.deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'section_not_found');
  END IF;

  IF v_active_year_id IS NULL THEN
    v_active_year_id := v_section_rec.academic_year_id;
  END IF;

  -- 2. Compute date boundaries
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + INTERVAL '1 month - 1 day')::DATE;

  -- 3. Count distinct school working dates marked in this section/month
  SELECT COUNT(DISTINCT a.date)
    INTO v_total_working_days
    FROM public.attendance a
   WHERE a.school_id = p_school_id
     AND a.section_id = p_section_id
     AND a.date >= v_start_date
     AND a.date <= v_end_date;

  -- 4. Aggregate student attendance matrix
  SELECT COALESCE(jsonb_agg(stud_row ORDER BY stud_row.roll_num_int ASC, stud_row.student_name ASC), '[]'::JSONB)
    INTO v_students
    FROM (
      SELECT
        st.id AS student_id,
        se.id AS enrollment_id,
        COALESCE(se.roll_number, '') AS roll_number,
        COALESCE(NULLIF(regexp_replace(se.roll_number, '\D', '', 'g'), '')::INT, 999999) AS roll_num_int,
        TRIM(st.first_name || ' ' || COALESCE(st.last_name, '')) AS student_name,
        COALESCE(st.gender, 'NOT_SPECIFIED') AS gender,
        COALESCE(att_days.days_map, '{}'::JSONB) AS days,
        COALESCE(att_days.present_count, 0) AS present_count,
        COALESCE(att_days.absent_count, 0) AS absent_count,
        COALESCE(att_days.late_count, 0) AS late_count,
        CASE
          WHEN v_total_working_days > 0 THEN
            ROUND((COALESCE(att_days.present_count, 0)::NUMERIC / v_total_working_days::NUMERIC) * 100, 1)
          ELSE 0.0
        END AS attendance_percentage
        FROM public.student_enrollments se
        JOIN public.students st ON st.id = se.student_id
        LEFT JOIN LATERAL (
          SELECT
            jsonb_object_agg(EXTRACT(DAY FROM a.date)::INT::TEXT, a.status) AS days_map,
            COUNT(CASE WHEN a.status IN ('PRESENT', 'HALF_DAY') THEN 1 END) AS present_count,
            COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) AS absent_count,
            COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) AS late_count
            FROM public.attendance a
           WHERE a.student_id = st.id
             AND a.section_id = p_section_id
             AND a.date >= v_start_date
             AND a.date <= v_end_date
        ) att_days ON true
       WHERE st.school_id = p_school_id
         AND se.section_id = p_section_id
         AND (v_active_year_id IS NULL OR se.academic_year_id = v_active_year_id)
         AND se.status = 'ACTIVE'
         AND se.deleted_at IS NULL
         AND (
           NOT v_is_parent
           OR public.parent_can_access_student(st.id)
         )
    ) stud_row;

  RETURN jsonb_build_object(
    'section_id', v_section_rec.id,
    'class_name', v_section_rec.class_name,
    'section_name', v_section_rec.section_name,
    'month', p_month,
    'year', p_year,
    'total_working_days', v_total_working_days,
    'students', v_students
  );
END;
$$;

REVOKE ALL ON FUNCTION public._get_attendance_monthly_register_unsafe(UUID, UUID, INT, INT, UUID, UUID, TEXT) FROM public, anon, authenticated;

-- Public Session-Guarded Wrapper for get_attendance_monthly_register
CREATE OR REPLACE FUNCTION public.get_attendance_monthly_register(
  p_section_id UUID,
  p_month INT,
  p_year INT,
  p_academic_year_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sess JSONB := public.current_session();
BEGIN
  IF v_sess IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required');
  END IF;

  IF p_month < 1 OR p_month > 12 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_month');
  END IF;

  RETURN public._get_attendance_monthly_register_unsafe(
    public.current_school_id(),
    p_section_id,
    p_month,
    p_year,
    p_academic_year_id,
    public.current_user_id(),
    public.current_app_role()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_attendance_monthly_register(UUID, INT, INT, UUID) TO anon, authenticated, service_role;


-- ==============================================================================
-- 4. collect_fee_payment (Atomic Invoice Settlement & Receipting)
-- ==============================================================================
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


-- ==============================================================================
-- 5. validate_timetable_conflict (Pre-Flight Timetable Conflict Checker)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public._validate_timetable_conflict_unsafe(
  p_school_id UUID,
  p_academic_year_id UUID,
  p_day_of_week INT,
  p_start_time TIME,
  p_end_time TIME,
  p_teacher_id UUID,
  p_section_id UUID,
  p_exclude_period_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_conflicts JSONB := '[]'::JSONB;
  v_teacher_conflict RECORD;
  v_section_conflict RECORD;
BEGIN
  -- 1. Validate Teacher Overlap
  IF p_teacher_id IS NOT NULL THEN
    SELECT
      tp.id AS conflicting_period_id,
      tp.period_number,
      c.name AS class_name,
      s.name AS section_name,
      TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS teacher_name
      INTO v_teacher_conflict
      FROM public.timetable_periods tp
      JOIN public.sections s ON s.id = tp.section_id
      JOIN public.classes c ON c.id = s.class_id
      JOIN public.users u ON u.id = tp.teacher_id
     WHERE tp.school_id = p_school_id
       AND tp.academic_year_id = p_academic_year_id
       AND tp.day_of_week = p_day_of_week
       AND tp.teacher_id = p_teacher_id
       AND (p_exclude_period_id IS NULL OR tp.id != p_exclude_period_id)
       AND tp.deleted_at IS NULL
       AND (tp.start_time, tp.end_time) OVERLAPS (p_start_time, p_end_time)
     LIMIT 1;

    IF v_teacher_conflict.conflicting_period_id IS NOT NULL THEN
      v_conflicts := v_conflicts || jsonb_build_object(
        'type', 'TEACHER_DOUBLE_BOOKED',
        'message', format('Teacher %s is already teaching %s-%s during this time slot.',
                          v_teacher_conflict.teacher_name,
                          v_teacher_conflict.class_name,
                          v_teacher_conflict.section_name),
        'conflicting_period_id', v_teacher_conflict.conflicting_period_id
      );
    END IF;
  END IF;

  -- 2. Validate Section Overlap
  IF p_section_id IS NOT NULL THEN
    SELECT
      tp.id AS conflicting_period_id,
      tp.period_number,
      sub.name AS subject_name,
      TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS teacher_name
      INTO v_section_conflict
      FROM public.timetable_periods tp
      JOIN public.subjects sub ON sub.id = tp.subject_id
      LEFT JOIN public.users u ON u.id = tp.teacher_id
     WHERE tp.school_id = p_school_id
       AND tp.academic_year_id = p_academic_year_id
       AND tp.day_of_week = p_day_of_week
       AND tp.section_id = p_section_id
       AND (p_exclude_period_id IS NULL OR tp.id != p_exclude_period_id)
       AND tp.deleted_at IS NULL
       AND (tp.start_time, tp.end_time) OVERLAPS (p_start_time, p_end_time)
     LIMIT 1;

    IF v_section_conflict.conflicting_period_id IS NOT NULL THEN
      v_conflicts := v_conflicts || jsonb_build_object(
        'type', 'SECTION_DOUBLE_BOOKED',
        'message', format('This section already has a %s class scheduled during this time slot.',
                          v_section_conflict.subject_name),
        'conflicting_period_id', v_section_conflict.conflicting_period_id
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'has_conflict', (jsonb_array_length(v_conflicts) > 0),
    'conflicts', v_conflicts
  );
END;
$$;

REVOKE ALL ON FUNCTION public._validate_timetable_conflict_unsafe(UUID, UUID, INT, TIME, TIME, UUID, UUID, UUID) FROM public, anon, authenticated;

-- Public Session-Guarded Wrapper for validate_timetable_conflict
CREATE OR REPLACE FUNCTION public.validate_timetable_conflict(
  p_academic_year_id UUID,
  p_day_of_week INT,
  p_start_time TIME,
  p_end_time TIME,
  p_teacher_id UUID,
  p_section_id UUID,
  p_exclude_period_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sess JSONB := public.current_session();
BEGIN
  IF v_sess IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required');
  END IF;

  IF p_start_time >= p_end_time THEN
    RETURN jsonb_build_object(
      'has_conflict', true,
      'conflicts', jsonb_build_array(jsonb_build_object(
        'type', 'INVALID_TIME_RANGE',
        'message', 'Start time must be strictly before end time.'
      ))
    );
  END IF;

  RETURN public._validate_timetable_conflict_unsafe(
    public.current_school_id(),
    p_academic_year_id,
    p_day_of_week,
    p_start_time,
    p_end_time,
    p_teacher_id,
    p_section_id,
    p_exclude_period_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_timetable_conflict(UUID, INT, TIME, TIME, UUID, UUID, UUID) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
