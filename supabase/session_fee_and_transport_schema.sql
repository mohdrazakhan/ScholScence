-- ==============================================================================
-- SchoolSense — Session-Scoped Fee & Transport Schema
-- Each academic session (academic_years) has its own isolated structure for
-- Fee Structures, Student Invoices, Transport Routes, and Student Bus Passes.
-- ==============================================================================

SET search_path = public, extensions;

-- ==============================================================================
-- 1. FEES MANAGEMENT (Session-Scoped)
-- ==============================================================================

-- 1.1 Fee Categories (Institutional Fee Heads: Tuition, Lab, Sports, Bus, Exam, etc.)
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

-- 1.2 Fee Structures (Per Academic Session + Class + Fee Head)
CREATE TABLE IF NOT EXISTS public.fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  fee_category_id UUID NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  frequency VARCHAR(50) NOT NULL DEFAULT 'MONTHLY', -- MONTHLY, QUARTERLY, ANNUALLY, ONE_TIME
  due_day INT NOT NULL DEFAULT 10,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_fee_structure_session_class_cat UNIQUE (school_id, academic_year_id, class_id, fee_category_id)
);

-- 1.3 Student Fee Invoices (Session-Scoped Student Billing Ledger)
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
  status VARCHAR(20) NOT NULL DEFAULT 'UNPAID', -- PAID, PARTIAL, UNPAID, OVERDUE
  items JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_fee_invoice_number UNIQUE (school_id, invoice_number)
);

-- 1.4 Fee Payments & Receipt Ledger
CREATE TABLE IF NOT EXISTS public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  invoice_id UUID NOT NULL REFERENCES public.student_fee_invoices(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  receipt_number VARCHAR(100) NOT NULL,
  amount_paid NUMERIC(10, 2) NOT NULL,
  payment_mode VARCHAR(50) NOT NULL DEFAULT 'CASH', -- CASH, UPI, CARD, NET_BANKING, CHEQUE
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_reference VARCHAR(150),
  collected_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  collected_by_name VARCHAR(150),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ==============================================================================
-- 2. TRANSPORT DEPARTMENT (Session-Scoped Routes & Passes, School Fleet Assets)
-- ==============================================================================

-- 2.1 Fleet Vehicles (Physical school assets: Bus, Van, Mini-Bus)
CREATE TABLE IF NOT EXISTS public.transport_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  vehicle_number VARCHAR(50) NOT NULL,
  bus_number VARCHAR(50),
  vehicle_type VARCHAR(50) NOT NULL DEFAULT 'BUS', -- BUS, VAN, MINI_BUS
  model VARCHAR(100),
  seating_capacity INT NOT NULL DEFAULT 40,
  driver_name VARCHAR(150) NOT NULL,
  driver_phone VARCHAR(50) NOT NULL,
  driver_license VARCHAR(100),
  driver_photo_url TEXT,
  conductor_name VARCHAR(150),
  conductor_phone VARCHAR(50),
  gps_device_id VARCHAR(100),
  insurance_expiry DATE,
  fitness_expiry DATE,
  pollution_expiry DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_vehicle_number_per_school UNIQUE (school_id, vehicle_number)
);

-- 2.2 Transport Routes (Scoped to Academic Session)
CREATE TABLE IF NOT EXISTS public.transport_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL,
  vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
  morning_start_time VARCHAR(20) DEFAULT '07:00 AM',
  evening_start_time VARCHAR(20) DEFAULT '02:30 PM',
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_route_code_session UNIQUE (school_id, academic_year_id, code)
);

-- 2.3 Route Stops
CREATE TABLE IF NOT EXISTS public.transport_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  stop_name VARCHAR(150) NOT NULL,
  pickup_time VARCHAR(20) NOT NULL DEFAULT '07:15 AM',
  drop_time VARCHAR(20) NOT NULL DEFAULT '02:45 PM',
  sequence_order INT NOT NULL DEFAULT 1,
  monthly_fare NUMERIC(10, 2) NOT NULL DEFAULT 1200.00,
  landmark VARCHAR(200),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 2.4 Student Transport Subscriptions & Passes (Scoped to Academic Session)
CREATE TABLE IF NOT EXISTS public.student_transport_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES public.transport_stops(id) ON DELETE CASCADE,
  pass_number VARCHAR(100) NOT NULL,
  seat_number VARCHAR(20),
  emergency_contact VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_student_transport_session UNIQUE (school_id, academic_year_id, student_id)
);

-- ==============================================================================
-- 3. INDEXES FOR HIGH-PERFORMANCE SESSION LOOKUPS
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_fee_structures_session ON public.fee_structures(school_id, academic_year_id, class_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_session ON public.student_fee_invoices(school_id, academic_year_id, student_id, status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_session ON public.fee_payments(school_id, academic_year_id, student_id);

CREATE INDEX IF NOT EXISTS idx_transport_vehicles_school ON public.transport_vehicles(school_id, status);
CREATE INDEX IF NOT EXISTS idx_transport_routes_session ON public.transport_routes(school_id, academic_year_id, status);
CREATE INDEX IF NOT EXISTS idx_transport_stops_route ON public.transport_stops(school_id, route_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_student_transport_session ON public.student_transport_assignments(school_id, academic_year_id, route_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_transport_assignments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Fee Categories
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fee_categories' AND policyname = 'fee_categories_policy') THEN
    CREATE POLICY "fee_categories_policy" ON public.fee_categories FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Fee Structures
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fee_structures' AND policyname = 'fee_structures_policy') THEN
    CREATE POLICY "fee_structures_policy" ON public.fee_structures FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Fee Invoices
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_fee_invoices' AND policyname = 'student_fee_invoices_policy') THEN
    CREATE POLICY "student_fee_invoices_policy" ON public.student_fee_invoices FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Fee Payments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fee_payments' AND policyname = 'fee_payments_policy') THEN
    CREATE POLICY "fee_payments_policy" ON public.fee_payments FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Transport Vehicles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transport_vehicles' AND policyname = 'transport_vehicles_policy') THEN
    CREATE POLICY "transport_vehicles_policy" ON public.transport_vehicles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Transport Routes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transport_routes' AND policyname = 'transport_routes_policy') THEN
    CREATE POLICY "transport_routes_policy" ON public.transport_routes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Transport Stops
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transport_stops' AND policyname = 'transport_stops_policy') THEN
    CREATE POLICY "transport_stops_policy" ON public.transport_stops FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Student Transport Assignments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_transport_assignments' AND policyname = 'student_transport_assignments_policy') THEN
    CREATE POLICY "student_transport_assignments_policy" ON public.student_transport_assignments FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Reload Supabase PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
