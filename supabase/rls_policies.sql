-- ==============================================================================
-- SchoolSense Row Level Security (RLS) Policies for Supabase
-- Multi-Tenant Security & Isolation
-- ==============================================================================

-- Helper function: Check if user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_school_roles usr
    JOIN public.roles r ON r.id = usr.role_id
    WHERE usr.user_id = auth.uid()
      AND (r.code = 'SUPER_ADMIN' OR r.code = 'PLATFORM_ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get current user's school IDs
CREATE OR REPLACE FUNCTION public.get_user_school_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT school_id FROM public.user_school_roles
  WHERE user_id = auth.uid() AND status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- Enable RLS on all tables
-- ------------------------------------------------------------------------------

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_school_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_subject_teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_scale_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Public / Anon Read Policies (Needed for Login & School Picker)
-- ------------------------------------------------------------------------------

-- Allow anon & authenticated users to read active schools
CREATE POLICY "allow_read_active_schools" ON public.schools
  FOR SELECT TO anon, authenticated
  USING (status = 'ACTIVE');

-- Allow anon & authenticated users to read roles & permissions
CREATE POLICY "allow_read_roles" ON public.roles
  FOR SELECT TO anon, authenticated
  USING (TRUE);

CREATE POLICY "allow_read_permissions" ON public.permissions
  FOR SELECT TO anon, authenticated
  USING (TRUE);

CREATE POLICY "allow_read_role_permissions" ON public.role_permissions
  FOR SELECT TO anon, authenticated
  USING (TRUE);

-- ------------------------------------------------------------------------------
-- Super Admin Universal Bypass Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "super_admin_all_schools" ON public.schools FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "super_admin_all_users" ON public.users FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "super_admin_all_usr" ON public.user_school_roles FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "super_admin_all_classes" ON public.classes FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "super_admin_all_sections" ON public.sections FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "super_admin_all_subjects" ON public.subjects FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "super_admin_all_students" ON public.students FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "super_admin_all_attendance" ON public.attendance FOR ALL TO authenticated USING (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- Tenant (School) Isolation Policies
-- ------------------------------------------------------------------------------

-- Users can read their own profile or users in their school
CREATE POLICY "users_read_school_members" ON public.users
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR
    id IN (
      SELECT user_id FROM public.user_school_roles
      WHERE school_id IN (SELECT public.get_user_school_ids())
    )
  );

-- Users can read their own school role memberships
CREATE POLICY "usr_read_own_school" ON public.user_school_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    school_id IN (SELECT public.get_user_school_ids())
  );

-- School scoped tables (Classes, Sections, Subjects, Students, Attendance, etc.)
CREATE POLICY "school_classes_policy" ON public.classes
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "school_sections_policy" ON public.sections
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "school_subjects_policy" ON public.subjects
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "school_students_policy" ON public.students
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "school_attendance_policy" ON public.attendance
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "school_homework_policy" ON public.homework
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "school_exams_policy" ON public.exams
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "school_notices_policy" ON public.notices
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "school_events_policy" ON public.school_events
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "school_complaints_policy" ON public.complaints
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "school_timetable_policy" ON public.timetable_periods
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()));
