-- ==============================================================================
-- SchoolSense — Multi-Day Range & Recent Day-Book Summary RPC
-- ==============================================================================
-- Upgrades get_daily_daybook_summary to support both single-day and multi-day date ranges
-- and includes recent 20 cashier transactions for real-time reconciliation.
-- ==============================================================================

SET search_path = public, extensions;

DROP FUNCTION IF EXISTS public.get_daily_daybook_summary(DATE);
DROP FUNCTION IF EXISTS public.get_daily_daybook_summary(DATE, DATE);
DROP FUNCTION IF EXISTS public._get_daily_daybook_summary_unsafe(UUID, DATE);
DROP FUNCTION IF EXISTS public._get_daily_daybook_summary_unsafe(UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION public._get_daily_daybook_summary_unsafe(
  p_school_id UUID,
  p_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_is_range BOOLEAN := FALSE;
  v_cash NUMERIC(12, 2) := 0.00;
  v_upi NUMERIC(12, 2) := 0.00;
  v_cheque NUMERIC(12, 2) := 0.00;
  v_netbanking NUMERIC(12, 2) := 0.00;
  v_card NUMERIC(12, 2) := 0.00;
  v_grand_total NUMERIC(12, 2) := 0.00;
  v_receipts_list JSONB := '[]'::JSONB;
  v_recent_list JSONB := '[]'::JSONB;
BEGIN
  -- Determine date boundaries
  v_start_date := COALESCE(p_date, CURRENT_DATE);
  v_end_date := p_end_date;

  IF v_end_date IS NOT NULL AND v_end_date >= v_start_date THEN
    v_is_range := TRUE;
  ELSE
    v_end_date := v_start_date;
    v_is_range := FALSE;
  END IF;

  -- 1. Aggregations across selected date or range
  SELECT
    COALESCE(SUM(CASE WHEN payment_mode = 'CASH' THEN amount_paid ELSE 0 END), 0.00),
    COALESCE(SUM(CASE WHEN payment_mode IN ('UPI', 'QR') THEN amount_paid ELSE 0 END), 0.00),
    COALESCE(SUM(CASE WHEN payment_mode = 'CHEQUE' THEN amount_paid ELSE 0 END), 0.00),
    COALESCE(SUM(CASE WHEN payment_mode IN ('NET_BANKING', 'NEFT', 'IMPS') THEN amount_paid ELSE 0 END), 0.00),
    COALESCE(SUM(CASE WHEN payment_mode = 'CARD' THEN amount_paid ELSE 0 END), 0.00),
    COALESCE(SUM(amount_paid), 0.00)
    INTO v_cash, v_upi, v_cheque, v_netbanking, v_card, v_grand_total
    FROM public.fee_payments
   WHERE school_id = p_school_id
     AND payment_date BETWEEN v_start_date AND v_end_date
     AND deleted_at IS NULL;

  -- 2. Receipts list for the selected date or range
  SELECT COALESCE(jsonb_agg(r_row ORDER BY r_row.payment_date DESC, r_row.created_at DESC), '[]'::JSONB)
    INTO v_receipts_list
    FROM (
      SELECT
        p.id,
        p.receipt_number,
        p.amount_paid,
        p.amount_paid AS amount,
        p.payment_mode,
        p.payment_date,
        p.transaction_reference,
        COALESCE(p.collected_by_name, 'Fee Desk') AS collected_by_name,
        p.remarks,
        p.created_at,
        p.created_at AS payment_time,
        p.student_id,
        TRIM(s.first_name || ' ' || COALESCE(s.last_name, '')) AS student_name,
        COALESCE(s.admission_number, '') AS admission_number,
        COALESCE(c.name, 'Class') AS class_name,
        COALESCE(sec.name, 'A') AS section_name,
        i.invoice_number
        FROM public.fee_payments p
        JOIN public.students s ON s.id = p.student_id
        LEFT JOIN public.student_fee_invoices i ON i.id = p.invoice_id
        LEFT JOIN LATERAL (
          SELECT se.class_id, se.section_id
            FROM public.student_enrollments se
           WHERE se.student_id = s.id
             AND se.status = 'ACTIVE'
             AND se.deleted_at IS NULL
           ORDER BY se.created_at DESC LIMIT 1
        ) enr ON TRUE
        LEFT JOIN public.classes c ON c.id = enr.class_id
        LEFT JOIN public.sections sec ON sec.id = enr.section_id
       WHERE p.school_id = p_school_id
         AND p.payment_date BETWEEN v_start_date AND v_end_date
         AND p.deleted_at IS NULL
    ) r_row;

  -- 3. Always fetch recent 20 receipts across all days for cashier desk
  SELECT COALESCE(jsonb_agg(r_recent ORDER BY r_recent.payment_date DESC, r_recent.created_at DESC), '[]'::JSONB)
    INTO v_recent_list
    FROM (
      SELECT
        p.id,
        p.receipt_number,
        p.amount_paid,
        p.amount_paid AS amount,
        p.payment_mode,
        p.payment_date,
        p.transaction_reference,
        COALESCE(p.collected_by_name, 'Fee Desk') AS collected_by_name,
        p.remarks,
        p.created_at,
        p.created_at AS payment_time,
        p.student_id,
        TRIM(s.first_name || ' ' || COALESCE(s.last_name, '')) AS student_name,
        COALESCE(s.admission_number, '') AS admission_number,
        COALESCE(c.name, 'Class') AS class_name,
        COALESCE(sec.name, 'A') AS section_name,
        i.invoice_number
        FROM public.fee_payments p
        JOIN public.students s ON s.id = p.student_id
        LEFT JOIN public.student_fee_invoices i ON i.id = p.invoice_id
        LEFT JOIN LATERAL (
          SELECT se.class_id, se.section_id
            FROM public.student_enrollments se
           WHERE se.student_id = s.id
             AND se.status = 'ACTIVE'
             AND se.deleted_at IS NULL
           ORDER BY se.created_at DESC LIMIT 1
        ) enr ON TRUE
        LEFT JOIN public.classes c ON c.id = enr.class_id
        LEFT JOIN public.sections sec ON sec.id = enr.section_id
       WHERE p.school_id = p_school_id
         AND p.deleted_at IS NULL
       ORDER BY p.payment_date DESC, p.created_at DESC
       LIMIT 20
    ) r_recent;

  RETURN jsonb_build_object(
    'success', true,
    'date', v_start_date,
    'startDate', v_start_date,
    'endDate', v_end_date,
    'isRange', v_is_range,
    -- Top-level compatibility fields
    'total_collected', v_grand_total,
    'totalCollected', v_grand_total,
    'cash_amount', v_cash,
    'cashAmount', v_cash,
    'upi_amount', v_upi,
    'upiAmount', v_upi,
    'bank_amount', v_netbanking,
    'bankAmount', v_netbanking,
    'cheque_amount', v_cheque,
    'chequeAmount', v_cheque,
    'card_amount', v_card,
    'cardAmount', v_card,
    'transaction_count', jsonb_array_length(v_receipts_list),
    'transactionCount', jsonb_array_length(v_receipts_list),
    -- Nested summary object
    'summary', jsonb_build_object(
      'cashTotal', v_cash,
      'upiTotal', v_upi,
      'chequeTotal', v_cheque,
      'netbankingTotal', v_netbanking,
      'cardTotal', v_card,
      'grandTotal', v_grand_total,
      'totalReceipts', jsonb_array_length(v_receipts_list)
    ),
    -- Dual list access (transactions / receipts)
    'receipts', v_receipts_list,
    'transactions', v_receipts_list,
    'recentReceipts', v_recent_list,
    'recentTransactions', v_recent_list,
    'recent_transactions', v_recent_list
  );
END;
$$;

REVOKE ALL ON FUNCTION public._get_daily_daybook_summary_unsafe(UUID, DATE, DATE) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_daily_daybook_summary(
  p_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF public.current_session() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required');
  END IF;

  RETURN public._get_daily_daybook_summary_unsafe(
    public.current_school_id(),
    p_date,
    p_end_date
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_daybook_summary(
  p_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF public.current_session() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required');
  END IF;

  RETURN public._get_daily_daybook_summary_unsafe(
    public.current_school_id(),
    p_date,
    NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_daily_daybook_summary(DATE, DATE) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_daily_daybook_summary(DATE) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
