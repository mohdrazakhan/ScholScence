-- ==============================================================================
-- SchoolSense — Promocode Table & validate_and_apply_promocode Fix
-- ==============================================================================
-- Applies:
-- 1. public.fee_promocodes table with RLS
-- 2. Seed default promocodes (EARLYBIRD, SIBLING500, SCHOLAR20)
-- 3. public.validate_and_apply_promocode RPC with default parameters & full JSON fields
-- 4. Permissions granted to anon, authenticated, service_role
-- 5. PostgREST schema cache reload
-- ==============================================================================

SET search_path = public, extensions;

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.fee_promocodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('FLAT_INR', 'PERCENTAGE')),
  discount_value NUMERIC(10, 2) NOT NULL,
  max_discount_cap NUMERIC(10, 2) DEFAULT NULL,
  max_uses INT DEFAULT NULL,
  used_count INT NOT NULL DEFAULT 0,
  valid_until TIMESTAMPTZ DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_fee_promocodes_school_code UNIQUE (school_id, code)
);

CREATE INDEX IF NOT EXISTS idx_fee_promocodes_lookup
  ON public.fee_promocodes(school_id, upper(trim(code)))
  WHERE deleted_at IS NULL AND status = 'ACTIVE';

-- 2. Enable RLS
ALTER TABLE public.fee_promocodes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fee_promocodes' AND policyname = 'fee_promocodes_tenant_isolation') THEN
    CREATE POLICY fee_promocodes_tenant_isolation ON public.fee_promocodes
      FOR ALL USING (public.is_platform_admin() OR school_id = public.current_school_id())
      WITH CHECK (public.is_platform_admin() OR (school_id = public.current_school_id() AND public.is_staff_role()));
  END IF;
END $$;

GRANT ALL ON public.fee_promocodes TO postgres, service_role;
GRANT SELECT ON public.fee_promocodes TO anon, authenticated;

-- 3. Seed Standard Promocodes for Active Schools
DO $$
DECLARE
  sch RECORD;
BEGIN
  FOR sch IN
    SELECT id, code, name
      FROM public.schools
     WHERE upper(code) <> 'PLATFORM'
       AND deleted_at IS NULL
  LOOP
    -- 10% Early Bird (Max ₹1,000)
    INSERT INTO public.fee_promocodes (school_id, code, description, discount_type, discount_value, max_discount_cap, max_uses, status)
    VALUES (sch.id, 'EARLYBIRD', '10% Early Bird Fee Concession', 'PERCENTAGE', 10.00, 1000.00, 500, 'ACTIVE')
    ON CONFLICT (school_id, code) DO UPDATE
      SET discount_value = EXCLUDED.discount_value,
          status = 'ACTIVE',
          updated_at = now();

    -- ₹500 Flat Sibling Coupon
    INSERT INTO public.fee_promocodes (school_id, code, description, discount_type, discount_value, max_discount_cap, max_uses, status)
    VALUES (sch.id, 'SIBLING500', 'Flat ₹500 Family & Sibling Concession', 'FLAT_INR', 500.00, NULL, 500, 'ACTIVE')
    ON CONFLICT (school_id, code) DO UPDATE
      SET discount_value = EXCLUDED.discount_value,
          status = 'ACTIVE',
          updated_at = now();

    -- 20% Merit Scholarship (Max ₹2,000)
    INSERT INTO public.fee_promocodes (school_id, code, description, discount_type, discount_value, max_discount_cap, max_uses, status)
    VALUES (sch.id, 'SCHOLAR20', '20% Merit & Academic Excellence Scholarship', 'PERCENTAGE', 20.00, 2000.00, 200, 'ACTIVE')
    ON CONFLICT (school_id, code) DO UPDATE
      SET discount_value = EXCLUDED.discount_value,
          status = 'ACTIVE',
          updated_at = now();

    -- 100% RTE Waiver (Max ₹100,000)
    INSERT INTO public.fee_promocodes (school_id, code, description, discount_type, discount_value, max_discount_cap, max_uses, status)
    VALUES (sch.id, 'RTE_WAIVER', '100% Right to Education (RTE) Statutory Fee Waiver', 'PERCENTAGE', 100.00, 100000.00, 1000, 'ACTIVE')
    ON CONFLICT (school_id, code) DO UPDATE
      SET discount_value = EXCLUDED.discount_value,
          status = 'ACTIVE',
          updated_at = now();

    -- 15% Sibling Concession
    INSERT INTO public.fee_promocodes (school_id, code, description, discount_type, discount_value, max_discount_cap, max_uses, status)
    VALUES (sch.id, 'SIBLING15', '15% Family Concession for 2nd & 3rd Enrolled Siblings', 'PERCENTAGE', 15.00, 1500.00, 500, 'ACTIVE')
    ON CONFLICT (school_id, code) DO UPDATE
      SET discount_value = EXCLUDED.discount_value,
          status = 'ACTIVE',
          updated_at = now();

    -- 50% Staff Child Concession
    INSERT INTO public.fee_promocodes (school_id, code, description, discount_type, discount_value, max_discount_cap, max_uses, status)
    VALUES (sch.id, 'STAFFCHILD50', '50% Educational Concession for School Faculty & Staff Wards', 'PERCENTAGE', 50.00, 5000.00, 500, 'ACTIVE')
    ON CONFLICT (school_id, code) DO UPDATE
      SET discount_value = EXCLUDED.discount_value,
          status = 'ACTIVE',
          updated_at = now();

    -- 10% Merit Concession
    INSERT INTO public.fee_promocodes (school_id, code, description, discount_type, discount_value, max_discount_cap, max_uses, status)
    VALUES (sch.id, 'MERIT10', '10% Academic Merit & Honor Roll Concession', 'PERCENTAGE', 10.00, 1000.00, 500, 'ACTIVE')
    ON CONFLICT (school_id, code) DO UPDATE
      SET discount_value = EXCLUDED.discount_value,
          status = 'ACTIVE',
          updated_at = now();
  END LOOP;
END $$;

-- 4. Clean Drop of Previous Signatures
DROP FUNCTION IF EXISTS public.validate_and_apply_promocode(TEXT, UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.validate_and_apply_promocode(TEXT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS public.validate_and_apply_promocode(TEXT, UUID);
DROP FUNCTION IF EXISTS public.validate_and_apply_promocode(TEXT);

-- 5. Canonical RPC Definition
CREATE OR REPLACE FUNCTION public.validate_and_apply_promocode(
  p_code TEXT,
  p_invoice_id UUID DEFAULT NULL,
  p_amount NUMERIC DEFAULT 0.00
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id UUID := public.current_school_id();
  v_promo RECORD;
  v_discount NUMERIC(10, 2) := 0.00;
  v_final_payable NUMERIC(10, 2) := 0.00;
  v_actual_discount NUMERIC(10, 2) := 0.00;
  v_base_amount NUMERIC(10, 2) := COALESCE(p_amount, 0.00);
BEGIN
  IF public.current_session() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_required');
  END IF;

  IF p_code IS NULL OR TRIM(p_code) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'empty_promocode', 'message', 'Please enter a valid promocode.');
  END IF;

  -- If p_amount is 0 or null, and invoice_id is provided, resolve from invoice
  IF v_base_amount <= 0 AND p_invoice_id IS NOT NULL THEN
    SELECT (total_amount - paid_amount) INTO v_base_amount
      FROM public.student_fee_invoices
     WHERE id = p_invoice_id AND school_id = v_school_id AND deleted_at IS NULL;
    v_base_amount := COALESCE(v_base_amount, 0.00);
  END IF;

  SELECT *
    INTO v_promo
    FROM public.fee_promocodes
   WHERE school_id = v_school_id
     AND UPPER(TRIM(code)) = UPPER(TRIM(p_code))
     AND status = 'ACTIVE'
     AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
     AND (max_uses IS NULL OR used_count < max_uses)
     AND deleted_at IS NULL
   LIMIT 1;

  IF v_promo.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_or_expired_promocode',
      'message', format('Promocode %s is either invalid, expired, or has reached maximum usage limit.', TRIM(p_code))
    );
  END IF;

  -- Calculate discount
  IF v_promo.discount_type = 'PERCENTAGE' THEN
    v_discount := ROUND((v_base_amount * v_promo.discount_value) / 100.0, 2);
    IF v_promo.max_discount_cap IS NOT NULL AND v_promo.max_discount_cap > 0 THEN
      v_discount := LEAST(v_discount, v_promo.max_discount_cap);
    END IF;
  ELSE
    v_discount := v_promo.discount_value;
  END IF;

  -- Mandatory Ceiling Invariant: Discount can NEVER exceed total amount (No negative billing)
  v_actual_discount := LEAST(v_discount, v_base_amount);
  v_final_payable := GREATEST(0.00, v_base_amount - v_actual_discount);

  -- If invoice_id is supplied, record discount
  IF p_invoice_id IS NOT NULL THEN
    UPDATE public.student_fee_invoices
       SET discount_amount = COALESCE(discount_amount, 0.00) + v_actual_discount,
           updated_at = now()
     WHERE id = p_invoice_id AND school_id = v_school_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'code', v_promo.code,
    'discountType', v_promo.discount_type,
    'discountAmount', v_actual_discount,
    'discount_amount', v_actual_discount,
    'discountPercentage', CASE WHEN v_promo.discount_type = 'PERCENTAGE' THEN v_promo.discount_value ELSE NULL END,
    'discount_percentage', CASE WHEN v_promo.discount_type = 'PERCENTAGE' THEN v_promo.discount_value ELSE NULL END,
    'finalAmount', v_final_payable,
    'netPayable', v_final_payable,
    'message', format('Coupon %s applied! Saved ₹%s', v_promo.code, v_actual_discount)
  );
END;
$$;

-- 6. Permissions & PostgREST reload
GRANT EXECUTE ON FUNCTION public.validate_and_apply_promocode(TEXT, UUID, NUMERIC) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
