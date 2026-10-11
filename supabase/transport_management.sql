-- ==============================================================================
-- Transport Management Module (Fleet, Routes, Stops, Student Bus Subscriptions)
-- Fully Scoped to Academic Sessions (academic_years)
-- ==============================================================================

SET search_path = public, extensions;

-- 1. Transport Vehicles Fleet (Physical school assets)
CREATE TABLE IF NOT EXISTS public.transport_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  vehicle_number VARCHAR(50) NOT NULL,
  bus_number VARCHAR(50),
  vehicle_type VARCHAR(50) NOT NULL DEFAULT 'BUS',
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

-- 2. Transport Routes (Scoped to Academic Session)
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

-- 3. Route Stops
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

-- 4. Student Transport Subscriptions & Passes (Scoped to Academic Session)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transport_vehicles_school ON public.transport_vehicles(school_id, status);
CREATE INDEX IF NOT EXISTS idx_transport_routes_session ON public.transport_routes(school_id, academic_year_id, status);
CREATE INDEX IF NOT EXISTS idx_transport_stops_route ON public.transport_stops(school_id, route_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_student_transport_session ON public.student_transport_assignments(school_id, academic_year_id, route_id);

-- Enable RLS
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_transport_assignments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transport_vehicles' AND policyname = 'transport_vehicles_policy') THEN
    CREATE POLICY "transport_vehicles_policy" ON public.transport_vehicles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transport_routes' AND policyname = 'transport_routes_policy') THEN
    CREATE POLICY "transport_routes_policy" ON public.transport_routes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transport_stops' AND policyname = 'transport_stops_policy') THEN
    CREATE POLICY "transport_stops_policy" ON public.transport_stops FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_transport_assignments' AND policyname = 'student_transport_assignments_policy') THEN
    CREATE POLICY "student_transport_assignments_policy" ON public.student_transport_assignments FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
