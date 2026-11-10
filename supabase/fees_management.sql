-- ==============================================================================
-- Fees Management & Invoicing Schema & RPCs
-- Fully Scoped to Academic Sessions (academic_years)
-- ==============================================================================

SET search_path = public, extensions;

-- 1. Fee Categories
CREATE TABLE IF NOT EXISTS public.fee_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 2. Fee Structures (Scoped to Academic Session + Class)
CREATE TABLE IF NOT EXISTS public.fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  fee_category_id UUID NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  frequency VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
  due_day INT NOT NULL DEFAULT 10,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_fee_structure_session_class_cat UNIQUE (school_id, academic_year_id, class_id, fee_category_id)
);

-- 3. Student Fee Invoices (Scoped to Academic Session)
CREATE TABLE IF NOT EXISTS public.student_fee_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) NOT NULL,
  month_name VARCHAR(50),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  fine_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
  items JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_fee_invoice_number UNIQUE (school_id, invoice_number)
);

-- 4. Fee Payments & Receipts
CREATE TABLE IF NOT EXISTS public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  invoice_id UUID NOT NULL REFERENCES public.student_fee_invoices(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  receipt_number VARCHAR(100) NOT NULL,
  amount_paid NUMERIC(10, 2) NOT NULL,
  payment_mode VARCHAR(50) NOT NULL DEFAULT 'CASH',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_reference VARCHAR(150),
  collected_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  collected_by_name VARCHAR(150),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fee_structures_session ON public.fee_structures(school_id, academic_year_id, class_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_session ON public.student_fee_invoices(school_id, academic_year_id, student_id, status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_session ON public.fee_payments(school_id, academic_year_id, student_id);

-- Enable RLS
ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fee_categories' AND policyname = 'fee_categories_policy') THEN
    CREATE POLICY "fee_categories_policy" ON public.fee_categories FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fee_structures' AND policyname = 'fee_structures_policy') THEN
    CREATE POLICY "fee_structures_policy" ON public.fee_structures FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_fee_invoices' AND policyname = 'student_fee_invoices_policy') THEN
    CREATE POLICY "student_fee_invoices_policy" ON public.student_fee_invoices FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fee_payments' AND policyname = 'fee_payments_policy') THEN
    CREATE POLICY "fee_payments_policy" ON public.fee_payments FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
