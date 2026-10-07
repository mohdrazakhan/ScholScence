-- ==============================================================================
-- Classes & Grade Hierarchy Optimization RPCs
-- Replaces 48+ parallel requests on /academics?tab=classes with:
-- 1. get_classes_overview -> 1 single fast API for top summary cards & class cards list
-- 2. get_class_details -> On-demand single API when clicking/expanding a specific class
-- ==============================================================================

-- 1. Classes Overview (Top Matrices + Lightweight Class Cards)
DROP FUNCTION IF EXISTS public.get_classes_overview(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_classes_overview(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_classes_overview(
  p_school_id TEXT,
  p_academic_year_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_school_id UUID := p_school_id::UUID;
  v_active_year_id UUID := NULL;
  v_total_classes INT := 0;
  v_total_sections INT := 0;
  v_total_capacity INT := 0;
  v_enrolled_students INT := 0;
  v_classes_list JSONB := '[]'::JSONB;
  v_result JSONB;
BEGIN
  -- 1. Resolve Academic Year
  IF p_academic_year_id IS NOT NULL AND TRIM(p_academic_year_id) != '' THEN
    BEGIN
      v_active_year_id := p_academic_year_id::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_active_year_id := NULL;
    END;
  END IF;

  IF v_active_year_id IS NULL THEN
    SELECT id INTO v_active_year_id
    FROM public.academic_years
    WHERE school_id = v_school_id AND is_current = TRUE AND deleted_at IS NULL
    LIMIT 1;

    IF v_active_year_id IS NULL THEN
      SELECT id INTO v_active_year_id
      FROM public.academic_years
      WHERE school_id = v_school_id AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;
  END IF;

  -- 2. Count total classes
  SELECT COUNT(*) INTO v_total_classes
  FROM public.classes
  WHERE school_id = v_school_id AND deleted_at IS NULL;

  -- 3. Count total sections & capacity in this session
  SELECT 
    COUNT(*),
    COALESCE(SUM(COALESCE(capacity, 40)), 0)
  INTO v_total_sections, v_total_capacity
  FROM public.sections
  WHERE school_id = v_school_id
    AND deleted_at IS NULL
    AND (v_active_year_id IS NULL OR academic_year_id = v_active_year_id);

  -- 4. Count total enrolled active students in this session
  IF v_active_year_id IS NOT NULL THEN
    SELECT COUNT(DISTINCT se.student_id)
    INTO v_enrolled_students
    FROM public.student_enrollments se
    JOIN public.students s ON s.id = se.student_id
    WHERE se.academic_year_id = v_active_year_id
      AND s.school_id = v_school_id
      AND se.status = 'ACTIVE'
      AND s.status = 'ACTIVE'
      AND s.deleted_at IS NULL;
  ELSE
    SELECT COUNT(*)
    INTO v_enrolled_students
    FROM public.students
    WHERE school_id = v_school_id AND status = 'ACTIVE' AND deleted_at IS NULL;
  END IF;

  -- 5. Build Class Cards Summary List
  SELECT COALESCE(jsonb_agg(cls_row), '[]'::JSONB)
  INTO v_classes_list
  FROM (
    SELECT
      c.id,
      c.name,
      c.code,
      c.display_order AS "displayOrder",
      c.status,
      COUNT(DISTINCT sec.id) AS "sectionCount",
      COALESCE(SUM(COALESCE(sec.capacity, 40)), 0) AS "totalCapacity",
      COUNT(DISTINCT cs.id) AS "subjectCount",
      COUNT(DISTINCT CASE WHEN se.status = 'ACTIVE' AND s.status = 'ACTIVE' AND s.deleted_at IS NULL THEN se.student_id END) AS "enrolledCount"
    FROM public.classes c
    LEFT JOIN public.sections sec ON sec.class_id = c.id
      AND sec.deleted_at IS NULL
      AND (v_active_year_id IS NULL OR sec.academic_year_id = v_active_year_id)
    LEFT JOIN public.class_subjects cs ON cs.class_id = c.id
      AND (v_active_year_id IS NULL OR cs.academic_year_id = v_active_year_id)
    LEFT JOIN public.student_enrollments se ON se.class_id = c.id
      AND (v_active_year_id IS NULL OR se.academic_year_id = v_active_year_id)
    LEFT JOIN public.students s ON s.id = se.student_id
    WHERE c.school_id = v_school_id AND c.deleted_at IS NULL
    GROUP BY c.id, c.name, c.code, c.display_order, c.status
    ORDER BY c.display_order ASC, c.name ASC
  ) cls_row;

  -- 6. Assemble Result
  v_result := jsonb_build_object(
    'summary', jsonb_build_object(
      'totalClasses', v_total_classes,
      'totalSections', v_total_sections,
      'totalCapacity', v_total_capacity,
      'enrolledStudents', v_enrolled_students
    ),
    'academicYearId', v_active_year_id,
    'classes', v_classes_list
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_classes_overview(TEXT, TEXT) TO authenticated, anon, service_role;


-- 2. Class Details (On-Demand / Lazy Load for Single Class)
DROP FUNCTION IF EXISTS public.get_class_details(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_class_details(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_class_details(
  p_class_id TEXT,
  p_academic_year_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_class_id UUID := p_class_id::UUID;
  v_active_year_id UUID := NULL;
  v_class_rec RECORD;
  v_sections JSONB := '[]'::JSONB;
  v_subjects JSONB := '[]'::JSONB;
  v_result JSONB;
BEGIN
  -- 1. Parse Academic Year
  IF p_academic_year_id IS NOT NULL AND TRIM(p_academic_year_id) != '' THEN
    BEGIN
      v_active_year_id := p_academic_year_id::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_active_year_id := NULL;
    END;
  END IF;

  -- 2. Class Basic Info
  SELECT id, school_id, name, code, display_order, status
  INTO v_class_rec
  FROM public.classes
  WHERE id = v_class_id AND deleted_at IS NULL;

  IF v_class_rec.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Class not found');
  END IF;

  IF v_active_year_id IS NULL THEN
    SELECT id INTO v_active_year_id
    FROM public.academic_years
    WHERE school_id = v_class_rec.school_id AND is_current = TRUE AND deleted_at IS NULL
    LIMIT 1;
  END IF;

  -- 3. Sections for this class with student count and class teacher
  SELECT COALESCE(jsonb_agg(sec_row), '[]'::JSONB)
  INTO v_sections
  FROM (
    SELECT
      sec.id,
      sec.name,
      sec.code,
      sec.capacity,
      sec.display_order AS "displayOrder",
      sec.status,
      COUNT(DISTINCT CASE WHEN se.status = 'ACTIVE' AND s.status = 'ACTIVE' AND s.deleted_at IS NULL THEN se.student_id END) AS "enrolledCount",
      sta.teacher_id AS "classTeacherId",
      TRIM(u.first_name || ' ' || COALESCE(u.last_name, '')) AS "classTeacherName"
    FROM public.sections sec
    LEFT JOIN public.student_enrollments se ON se.section_id = sec.id
      AND (v_active_year_id IS NULL OR se.academic_year_id = v_active_year_id)
    LEFT JOIN public.students s ON s.id = se.student_id
    LEFT JOIN public.section_teacher_assignments sta ON sta.section_id = sec.id
      AND sta.status = 'ACTIVE'
      AND sta.deleted_at IS NULL
      AND (v_active_year_id IS NULL OR sta.academic_year_id = v_active_year_id)
    LEFT JOIN public.users u ON u.id = sta.teacher_id
    WHERE sec.class_id = v_class_id
      AND sec.deleted_at IS NULL
      AND (v_active_year_id IS NULL OR sec.academic_year_id = v_active_year_id)
    GROUP BY sec.id, sec.name, sec.code, sec.capacity, sec.display_order, sec.status, sta.teacher_id, u.first_name, u.last_name
    ORDER BY sec.display_order ASC, sec.name ASC
  ) sec_row;

  -- 4. Subjects for this class
  SELECT COALESCE(jsonb_agg(sub_row), '[]'::JSONB)
  INTO v_subjects
  FROM (
    SELECT
      cs.id AS "classSubjectId",
      sub.id AS "subjectId",
      sub.name,
      sub.code,
      sub.type,
      cs.periods_per_week AS "periodsPerWeek",
      cs.is_elective AS "isElective"
    FROM public.class_subjects cs
    JOIN public.subjects sub ON sub.id = cs.subject_id
    WHERE cs.class_id = v_class_id
      AND (v_active_year_id IS NULL OR cs.academic_year_id = v_active_year_id)
    ORDER BY sub.name ASC
  ) sub_row;

  -- 5. Return Detailed Payload
  v_result := jsonb_build_object(
    'class', jsonb_build_object(
      'id', v_class_rec.id,
      'name', v_class_rec.name,
      'code', v_class_rec.code,
      'displayOrder', v_class_rec.display_order,
      'status', v_class_rec.status
    ),
    'academicYearId', v_active_year_id,
    'sections', v_sections,
    'subjects', v_subjects
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_class_details(TEXT, TEXT) TO authenticated, anon, service_role;


-- ==============================================================================
-- 3. Section Students (Single Fast DB Query for Class & Section Roster)
-- ==============================================================================
DROP FUNCTION IF EXISTS public.get_section_students(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_section_students(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_section_students(
  p_section_id TEXT,
  p_academic_year_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_section_id UUID := p_section_id::UUID;
  v_active_year_id UUID := NULL;
  v_school_id UUID;
  v_class_id UUID;
  v_class_name TEXT;
  v_section_name TEXT;
  v_students JSONB := '[]'::JSONB;
BEGIN
  -- 1. Resolve section & class info
  SELECT sec.school_id, sec.class_id, sec.name, c.name
  INTO v_school_id, v_class_id, v_section_name, v_class_name
  FROM public.sections sec
  JOIN public.classes c ON c.id = sec.class_id
  WHERE sec.id = v_section_id;

  IF v_school_id IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;

  -- 2. Resolve Academic Year
  IF p_academic_year_id IS NOT NULL AND TRIM(p_academic_year_id) != '' THEN
    BEGIN
      v_active_year_id := p_academic_year_id::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_active_year_id := NULL;
    END;
  END IF;

  IF v_active_year_id IS NULL THEN
    SELECT id INTO v_active_year_id
    FROM public.academic_years
    WHERE school_id = v_school_id AND is_current = TRUE AND deleted_at IS NULL
    LIMIT 1;
  END IF;

  -- 3. Fetch section students with primary guardian info in a single joined query
  SELECT COALESCE(jsonb_agg(st_row), '[]'::JSONB)
  INTO v_students
  FROM (
    SELECT
      s.id,
      s.id AS "studentId",
      se.id AS "enrollmentId",
      s.admission_number AS "admissionNumber",
      s.first_name AS "firstName",
      COALESCE(s.last_name, '') AS "lastName",
      TRIM(s.first_name || ' ' || COALESCE(s.last_name, '')) AS "fullName",
      COALESCE(se.roll_number, s.roll_number, 1) AS "rollNumber",
      COALESCE(s.gender, 'MALE') AS "gender",
      s.date_of_birth AS "dateOfBirth",
      s.blood_group AS "bloodGroup",
      COALESCE(v_class_name, 'Class') AS "className",
      COALESCE(v_section_name, 'Section A') AS "sectionName",
      v_class_id AS "classId",
      v_section_id AS "sectionId",
      COALESCE(s.photo_url, s.avatar_url, '') AS "photoUrl",
      COALESCE(s.guardian_photo_url, s.emergency_contact_photo_url, '') AS "guardianPhotoUrl",
      COALESCE(se.status, s.status, 'ACTIVE') AS "status",
      COALESCE(g_info.g_name, s.emergency_contact_name, '') AS "guardianName",
      COALESCE(g_info.g_phone, s.emergency_contact_phone, '') AS "guardianPhone",
      COALESCE(g_info.g_rel, 'GUARDIAN') AS "guardianRelationship",
      COALESCE(g_info.g_email, '') AS "guardianEmail",
      jsonb_build_object(
        'first_name', COALESCE(g_info.g_name, s.emergency_contact_name, 'Guardian'),
        'last_name', '',
        'phone', COALESCE(g_info.g_phone, s.emergency_contact_phone, ''),
        'email', COALESCE(g_info.g_email, ''),
        'relationship', COALESCE(g_info.g_rel, 'Guardian'),
        'photoUrl', COALESCE(g_info.g_photo, s.guardian_photo_url, s.emergency_contact_photo_url, '')
      ) AS "primaryContact"
    FROM public.student_enrollments se
    JOIN public.students s ON s.id = se.student_id
    LEFT JOIN LATERAL (
      SELECT
        TRIM(g.first_name || ' ' || COALESCE(g.last_name, '')) AS g_name,
        g.phone AS g_phone,
        g.email AS g_email,
        sg.relationship AS g_rel,
        COALESCE(g.photo_url, g.avatar_url, '') AS g_photo
      FROM public.student_guardians sg
      JOIN public.guardians g ON g.id = sg.guardian_id
      WHERE sg.student_id = s.id AND sg.deleted_at IS NULL
      ORDER BY sg.is_primary DESC NULLS LAST, sg.created_at ASC
      LIMIT 1
    ) g_info ON TRUE
    WHERE se.section_id = v_section_id
      AND (v_active_year_id IS NULL OR se.academic_year_id = v_active_year_id)
      AND s.deleted_at IS NULL
    ORDER BY COALESCE(se.roll_number, s.roll_number, 1) ASC, s.first_name ASC
  ) st_row;

  RETURN v_students;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_section_students(TEXT, TEXT) TO authenticated, anon, service_role;


-- ==============================================================================
-- 4. Student Deactivation Requests Schema
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_deactivation_requests (
  id TEXT PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL DEFAULT 'INACTIVE',
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  admission_number TEXT,
  class_id UUID,
  class_name TEXT,
  section_id UUID,
  section_name TEXT,
  target_class_id UUID,
  target_class_name TEXT,
  target_section_id UUID,
  target_section_name TEXT,
  target_roll_number TEXT,
  target_status TEXT,
  passing_session TEXT,
  leaving_certificate_number TEXT,
  requested_by_user_id UUID,
  requested_by_name TEXT,
  requested_by_role TEXT,
  reason TEXT,
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reviewed_by_user_id UUID,
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_deactivation_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_deactivation_requests' 
      AND policyname = 'student_deactivation_requests_all'
  ) THEN
    CREATE POLICY "student_deactivation_requests_all"
      ON public.student_deactivation_requests
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

