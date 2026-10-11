-- ====================================================================
-- SchoolSense — Departmental Users & Custom Feature Permissions Schema
-- ====================================================================
-- Enables Institution Administrators (School Admins, Principals, Super Admins)
-- to create departmental logins (Fee Dept, Transport Dept, Librarian, Sports,
-- Security, Reception, Co-Admins) with granular feature access controls.
-- ====================================================================

-- 1. Ensure columns exist on public.users
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS designation text,
  ADD COLUMN IF NOT EXISTS custom_permissions jsonb DEFAULT '[]'::jsonb;

-- 2. Ensure columns exist on public.user_school_roles
ALTER TABLE public.user_school_roles 
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS designation text,
  ADD COLUMN IF NOT EXISTS custom_permissions jsonb DEFAULT '[]'::jsonb;

-- 3. Create index for fast lookup of school-scoped departmental users
CREATE INDEX IF NOT EXISTS idx_usr_school_role_status 
  ON public.user_school_roles(school_id, role_id, status);

CREATE INDEX IF NOT EXISTS idx_users_department 
  ON public.users(department);

-- 4. RLS Policy Check (Idempotent)
DO $$
BEGIN
  -- Grant full administrative permissions for school admins / principals on their school's users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_school_roles' AND policyname = 'admin_manage_school_users'
  ) THEN
    CREATE POLICY admin_manage_school_users ON public.user_school_roles
      FOR ALL
      TO authenticated
      USING (
        public.is_platform_admin() 
        OR (school_id = public.current_school_id() AND public.is_staff_role())
      )
      WITH CHECK (
        public.is_platform_admin() 
        OR (school_id = public.current_school_id() AND public.is_staff_role())
      );
  END IF;
END $$;
