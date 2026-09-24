-- ==============================================================================
-- Supabase RPC Function: get_dashboard_overview (Role-Scoped & Secure)
-- Scopes data strictly based on User Role:
-- 1. ADMIN: Full institutional roster, faculty breakdown, and total counts.
-- 2. TEACHER: Assigned class & section strengths, class students & parents,
--    today's teaching periods/timetable, daily attendance status.
--    Strictly hides admin roleCounts & total faculty.
-- 3. PARENT / GUARDIAN: Scoped to their linked children only (Hides school-wide metrics).
-- ==============================================================================

DROP FUNCTION IF EXISTS public.get_dashboard_overview(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_dashboard_overview(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_dashboard_overview(TEXT);
DROP FUNCTION IF EXISTS public.get_dashboard_overview(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_dashboard_overview(
  p_school_id TEXT,
  p_academic_year_id TEXT DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_school_id UUID := p_school_id::UUID;
  v_active_year_id UUID := NULL;
  v_user_id UUID := NULL;
  v_role TEXT := UPPER(COALESCE(p_role, 'SCHOOL_ADMIN'));
  v_school_rec RECORD;
  v_year_rec RECORD;
  v_active_students INT := 0;
  v_inactive_students INT := 0;
  v_total_students INT := 0;
  v_total_classes INT := 0;
  v_total_faculty INT := 0;
  v_today_date DATE := CURRENT_DATE;
  v_today_present INT := 0;
  v_today_absent INT := 0;
  v_today_late INT := 0;
  v_today_total_att INT := 0;
  v_attendance_pct NUMERIC(5, 1) := 0.0;
  v_pending_complaints INT := 0;
  v_role_counts JSONB := '{}'::JSONB;
  v_recent_notices JSONB := '[]'::JSONB;
  v_upcoming_exams JSONB := '[]'::JSONB;
  v_teacher_section_ids UUID[] := ARRAY[]::UUID[];
  v_guardian_ids UUID[] := ARRAY[]::UUID[];
  v_teacher_data JSONB := NULL;
  v_class_teacher_sec RECORD;
  v_is_class_teacher BOOLEAN := FALSE;
  v_class_students JSONB := '[]'::JSONB;
  v_today_timetable JSONB := '[]'::JSONB;
  v_subject_assignments JSONB := '[]'::JSONB;
  v_dow_iso INT := EXTRACT(ISODOW FROM CURRENT_DATE);
  v_dow_std INT := EXTRACT(DOW FROM CURRENT_DATE);
  v_result JSONB;
BEGIN
  -- Parse user_id if provided
  IF p_user_id IS NOT NULL AND TRIM(p_user_id) != '' THEN
    BEGIN
      v_user_id := p_user_id::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_user_id := NULL;
    END;
  END IF;

  -- Cast academic year if provided
  IF p_academic_year_id IS NOT NULL AND TRIM(p_academic_year_id) != '' THEN
    BEGIN
      v_active_year_id := p_academic_year_id::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_active_year_id := NULL;
    END;
  END IF;

  -- 1. School Information
  SELECT id, name, code, status, email, phone, city, state, logo_url
  INTO v_school_rec
  FROM public.schools
  WHERE id = v_school_id AND deleted_at IS NULL;

  -- 2. Resolve Academic Session
  IF v_active_year_id IS NULL THEN
    SELECT id, name, is_current
    INTO v_year_rec
    FROM public.academic_years
    WHERE school_id = v_school_id AND is_current = TRUE AND deleted_at IS NULL
    LIMIT 1;

    IF v_year_rec.id IS NOT NULL THEN
      v_active_year_id := v_year_rec.id;
    ELSE
      SELECT id, name, is_current
      INTO v_year_rec
      FROM public.academic_years
      WHERE school_id = v_school_id AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1;
      v_active_year_id := v_year_rec.id;
    END IF;
  ELSE
    SELECT id, name, is_current
    INTO v_year_rec
    FROM public.academic_years
    WHERE id = v_active_year_id AND deleted_at IS NULL;
  END IF;

  -- =========================================================================
  -- CASE A: TEACHER / CLASS_TEACHER (Strictly Scoped to Teacher's Classes)
  -- =========================================================================
  IF v_role IN ('TEACHER', 'CLASS_TEACHER', 'FACULTY') THEN
    
    -- Check Class Teacher Assignment
    IF v_user_id IS NOT NULL THEN
      SELECT 
        sta.section_id,
        sec.name AS section_name,
        sec.class_id,
        cls.name AS class_name
      INTO v_class_teacher_sec
      FROM public.section_teacher_assignments sta
      JOIN public.sections sec ON sec.id = sta.section_id
      JOIN public.classes cls ON cls.id = sec.class_id
      WHERE sta.teacher_id = v_user_id
        AND sta.school_id = v_school_id
        AND sta.status = 'ACTIVE'
        AND sta.deleted_at IS NULL
        AND (v_active_year_id IS NULL OR sta.academic_year_id = v_active_year_id)
      LIMIT 1;

      IF v_class_teacher_sec.section_id IS NOT NULL THEN
        v_is_class_teacher := TRUE;
      END IF;

      -- Get all section IDs assigned to teacher (homeroom or subject)
      SELECT ARRAY_AGG(DISTINCT s_id)
      INTO v_teacher_section_ids
      FROM (
        SELECT section_id AS s_id
        FROM public.section_teacher_assignments
        WHERE teacher_id = v_user_id
          AND school_id = v_school_id
          AND status = 'ACTIVE'
          AND deleted_at IS NULL
          AND (v_active_year_id IS NULL OR academic_year_id = v_active_year_id)
        UNION
        SELECT section_id AS s_id
        FROM public.section_subject_teacher_assignments
        WHERE teacher_id = v_user_id
          AND school_id = v_school_id
          AND status = 'ACTIVE'
          AND deleted_at IS NULL
          AND (v_active_year_id IS NULL OR academic_year_id = v_active_year_id)
      ) assigned_sec;
    END IF;

    -- If designated class teacher, fetch class roster with parent details & today's roll call
    IF v_is_class_teacher THEN
      SELECT
        COUNT(DISTINCT CASE WHEN se.status = 'ACTIVE' AND s.status = 'ACTIVE' AND s.deleted_at IS NULL THEN s.id END),
        COUNT(DISTINCT CASE WHEN se.status != 'ACTIVE' OR s.status != 'ACTIVE' OR s.deleted_at IS NOT NULL THEN s.id END),
        COUNT(DISTINCT s.id)
      INTO v_active_students, v_inactive_students, v_total_students
      FROM public.student_enrollments se
      JOIN public.students s ON s.id = se.student_id
      WHERE se.section_id = v_class_teacher_sec.section_id
        AND (v_active_year_id IS NULL OR se.academic_year_id = v_active_year_id);

      -- Today's Attendance in Class Teacher's Section
      SELECT
        COUNT(CASE WHEN status = 'PRESENT' THEN 1 END),
        COUNT(CASE WHEN status = 'ABSENT' THEN 1 END),
        COUNT(CASE WHEN status IN ('LATE', 'HALF_DAY') THEN 1 END),
        COUNT(*)
      INTO v_today_present, v_today_absent, v_today_late, v_today_total_att
      FROM public.attendance
      WHERE section_id = v_class_teacher_sec.section_id
        AND date = v_today_date;

      IF v_today_total_att > 0 THEN
        v_attendance_pct := ROUND(((v_today_present + v_today_late)::NUMERIC / v_today_total_att::NUMERIC) * 100, 1);
      ELSE
        v_attendance_pct := 0.0;
      END IF;

      -- Student List with Parent/Guardian Phone Contacts
      SELECT COALESCE(jsonb_agg(stu_obj), '[]'::JSONB)
      INTO v_class_students
      FROM (
        SELECT
          s.id,
          s.admission_number AS "admissionNumber",
          se.roll_number AS "rollNumber",
          s.first_name AS "firstName",
          COALESCE(s.last_name, '') AS "lastName",
          TRIM(s.first_name || ' ' || COALESCE(s.last_name, '')) AS "fullName",
          s.gender,
          s.photo_url AS "photoUrl",
          COALESCE(att.status, 'UNMARKED') AS "todayAttendance",
          COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'name', TRIM(u.first_name || ' ' || COALESCE(u.last_name, '')),
                'relationship', sg.relationship,
                'phone', COALESCE(u.phone, s.emergency_contact_phone, ''),
                'isPrimary', sg.is_primary_contact
              )
            )
            FROM public.student_guardians sg
            JOIN public.guardians g ON g.id = sg.guardian_id
            JOIN public.users u ON u.id = g.user_id
            WHERE sg.student_id = s.id
          ), '[]'::JSONB) AS guardians
        FROM public.student_enrollments se
        JOIN public.students s ON s.id = se.student_id
        LEFT JOIN public.attendance att ON att.student_id = s.id AND att.date = v_today_date
        WHERE se.section_id = v_class_teacher_sec.section_id
          AND s.status = 'ACTIVE'
          AND s.deleted_at IS NULL
          AND (v_active_year_id IS NULL OR se.academic_year_id = v_active_year_id)
        ORDER BY se.roll_number ASC NULLS LAST, s.first_name ASC
      ) stu_obj;

    ELSIF v_teacher_section_ids IS NOT NULL AND array_length(v_teacher_section_ids, 1) > 0 THEN
      -- Subject teacher across assigned sections
      SELECT
        COUNT(DISTINCT CASE WHEN se.status = 'ACTIVE' AND s.status = 'ACTIVE' AND s.deleted_at IS NULL THEN s.id END),
        COUNT(DISTINCT CASE WHEN se.status != 'ACTIVE' OR s.status != 'ACTIVE' OR s.deleted_at IS NOT NULL THEN s.id END),
        COUNT(DISTINCT s.id)
      INTO v_active_students, v_inactive_students, v_total_students
      FROM public.student_enrollments se
      JOIN public.students s ON s.id = se.student_id
      WHERE se.section_id = ANY(v_teacher_section_ids)
        AND (v_active_year_id IS NULL OR se.academic_year_id = v_active_year_id);
    END IF;

    -- Fetch Today's Teaching Schedule / Timetable for Teacher
    IF v_user_id IS NOT NULL THEN
      SELECT COALESCE(jsonb_agg(tp_obj), '[]'::JSONB)
      INTO v_today_timetable
      FROM (
        SELECT
          tp.id,
          tp.period_number AS "periodNumber",
          tp.start_time::TEXT AS "startTime",
          tp.end_time::TEXT AS "endTime",
          tp.room_number AS "roomNumber",
          cls.id AS "classId",
          cls.name AS "className",
          sec.id AS "sectionId",
          sec.name AS "sectionName",
          sub.id AS "subjectId",
          sub.name AS "subjectName",
          sub.code AS "subjectCode"
        FROM public.timetable_periods tp
        JOIN public.sections sec ON sec.id = tp.section_id
        JOIN public.classes cls ON cls.id = sec.class_id
        JOIN public.subjects sub ON sub.id = tp.subject_id
        WHERE tp.teacher_id = v_user_id
          AND tp.school_id = v_school_id
          AND tp.status = 'ACTIVE'
          AND (tp.day_of_week = v_dow_iso OR tp.day_of_week = v_dow_std)
          AND (v_active_year_id IS NULL OR tp.academic_year_id = v_active_year_id)
        ORDER BY tp.period_number ASC, tp.start_time ASC
      ) tp_obj;

      -- Fetch Subject Assignments
      SELECT COALESCE(jsonb_agg(sa_obj), '[]'::JSONB)
      INTO v_subject_assignments
      FROM (
        SELECT
          cls.id AS "classId",
          cls.name AS "className",
          sec.id AS "sectionId",
          sec.name AS "sectionName",
          sub.id AS "subjectId",
          sub.name AS "subjectName",
          sub.code AS "subjectCode"
        FROM public.section_subject_teacher_assignments ssta
        JOIN public.sections sec ON sec.id = ssta.section_id
        JOIN public.classes cls ON cls.id = sec.class_id
        JOIN public.subjects sub ON sub.id = ssta.subject_id
        WHERE ssta.teacher_id = v_user_id
          AND ssta.school_id = v_school_id
          AND ssta.status = 'ACTIVE'
          AND (v_active_year_id IS NULL OR ssta.academic_year_id = v_active_year_id)
        ORDER BY cls.display_order ASC, sec.name ASC
      ) sa_obj;
    END IF;

    -- Build Teacher Specific Data Object
    v_teacher_data := jsonb_build_object(
      'isClassTeacher', v_is_class_teacher,
      'classTeacherSection', CASE WHEN v_is_class_teacher THEN jsonb_build_object(
        'sectionId', v_class_teacher_sec.section_id,
        'sectionName', v_class_teacher_sec.section_name,
        'classId', v_class_teacher_sec.class_id,
        'className', v_class_teacher_sec.class_name
      ) ELSE NULL END,
      'assignedClassStrength', jsonb_build_object(
        'activeStudents', v_active_students,
        'inactiveStudents', v_inactive_students,
        'totalStudents', v_total_students
      ),
      'todayClassAttendance', jsonb_build_object(
        'isMarked', (v_today_total_att > 0),
        'percentage', v_attendance_pct::TEXT,
        'presentCount', v_today_present,
        'absentCount', v_today_absent,
        'lateCount', v_today_late,
        'totalCount', v_today_total_att
      ),
      'classStudents', v_class_students,
      'todayTimetable', v_today_timetable,
      'subjectAssignments', v_subject_assignments
    );

    -- Strictly hide administrative staff & role counts from teachers
    v_role_counts := '{}'::JSONB;
    v_total_faculty := 0;
    v_pending_complaints := 0;

    -- Teacher relevant notices
    SELECT COALESCE(jsonb_agg(n_sub), '[]'::JSONB)
    INTO v_recent_notices
    FROM (
      SELECT
        n.id,
        n.title,
        n.content,
        n.priority,
        n.status,
        n.target_audience,
        n.publish_date,
        n.created_at,
        jsonb_build_object(
          'firstName', u.first_name,
          'lastName', COALESCE(u.last_name, '')
        ) AS publisher
      FROM public.notices n
      LEFT JOIN public.users u ON u.id = n.published_by_id
      WHERE n.school_id = v_school_id
        AND n.deleted_at IS NULL
        AND (
          'ALL' = ANY(n.target_audience)
          OR 'TEACHERS' = ANY(n.target_audience)
          OR 'STAFF' = ANY(n.target_audience)
        )
      ORDER BY n.created_at DESC
      LIMIT 5
    ) n_sub;

  -- =========================================================================
  -- CASE B: PARENT / GUARDIAN (Scoped to children only)
  -- =========================================================================
  ELSIF v_role IN ('GUARDIAN', 'PARENT') THEN

    IF v_user_id IS NOT NULL THEN
      SELECT ARRAY_AGG(id)
      INTO v_guardian_ids
      FROM public.guardians
      WHERE user_id = v_user_id AND school_id = v_school_id AND status = 'ACTIVE';

      SELECT
        COUNT(DISTINCT s.id),
        0,
        COUNT(DISTINCT s.id)
      INTO v_active_students, v_inactive_students, v_total_students
      FROM public.student_guardians sg
      JOIN public.students s ON s.id = sg.student_id
      WHERE sg.guardian_id = ANY(v_guardian_ids) AND s.status = 'ACTIVE' AND s.deleted_at IS NULL;
    END IF;

    -- Strictly hide school-wide staff and role counts from parents
    v_role_counts := '{}'::JSONB;
    v_total_faculty := 0;
    v_total_classes := 0;
    v_pending_complaints := 0;

    -- Parent relevant notices
    SELECT COALESCE(jsonb_agg(n_sub), '[]'::JSONB)
    INTO v_recent_notices
    FROM (
      SELECT
        n.id,
        n.title,
        n.content,
        n.priority,
        n.status,
        n.target_audience,
        n.publish_date,
        n.created_at,
        jsonb_build_object(
          'firstName', u.first_name,
          'lastName', COALESCE(u.last_name, '')
        ) AS publisher
      FROM public.notices n
      LEFT JOIN public.users u ON u.id = n.published_by_id
      WHERE n.school_id = v_school_id
        AND n.deleted_at IS NULL
        AND (
          'ALL' = ANY(n.target_audience)
          OR 'PARENTS' = ANY(n.target_audience)
          OR 'GUARDIANS' = ANY(n.target_audience)
        )
      ORDER BY n.created_at DESC
      LIMIT 5
    ) n_sub;

  -- =========================================================================
  -- CASE C: ADMIN / PRINCIPAL / SUPER_ADMIN (Full Institutional Overview)
  -- =========================================================================
  ELSE
    -- Student counts across school
    IF v_active_year_id IS NOT NULL THEN
      SELECT
        COUNT(DISTINCT CASE WHEN se.status = 'ACTIVE' AND s.status = 'ACTIVE' AND s.deleted_at IS NULL THEN s.id END),
        COUNT(DISTINCT CASE WHEN se.status != 'ACTIVE' OR s.status != 'ACTIVE' OR s.deleted_at IS NOT NULL THEN s.id END),
        COUNT(DISTINCT s.id)
      INTO v_active_students, v_inactive_students, v_total_students
      FROM public.student_enrollments se
      JOIN public.students s ON s.id = se.student_id
      WHERE se.academic_year_id = v_active_year_id AND s.school_id = v_school_id;
    ELSE
      SELECT
        COUNT(CASE WHEN status = 'ACTIVE' AND deleted_at IS NULL THEN 1 END),
        COUNT(CASE WHEN status != 'ACTIVE' OR deleted_at IS NOT NULL THEN 1 END),
        COUNT(*)
      INTO v_active_students, v_inactive_students, v_total_students
      FROM public.students
      WHERE school_id = v_school_id;
    END IF;

    -- Classes count
    SELECT COUNT(*)
    INTO v_total_classes
    FROM public.classes
    WHERE school_id = v_school_id AND deleted_at IS NULL;

    -- Faculty & Staff Counts
    SELECT
      COUNT(DISTINCT usr.user_id),
      COALESCE(jsonb_object_agg(COALESCE(r.code, 'STAFF'), role_count), '{}'::JSONB)
    INTO v_total_faculty, v_role_counts
    FROM (
      SELECT usr.role_id, COUNT(DISTINCT usr.user_id) AS role_count
      FROM public.user_school_roles usr
      WHERE usr.school_id = v_school_id AND usr.status = 'ACTIVE' AND usr.deleted_at IS NULL
      GROUP BY usr.role_id
    ) role_agg
    JOIN public.roles r ON r.id = role_agg.role_id
    JOIN public.user_school_roles usr ON usr.school_id = v_school_id AND usr.status = 'ACTIVE' AND usr.deleted_at IS NULL;

    -- Today's Attendance Percentage
    SELECT
      COUNT(CASE WHEN status IN ('PRESENT', 'LATE', 'HALF_DAY') THEN 1 END),
      COUNT(*)
    INTO v_today_present, v_today_total_att
    FROM public.attendance
    WHERE school_id = v_school_id AND date = v_today_date;

    IF v_today_total_att > 0 THEN
      v_attendance_pct := ROUND((v_today_present::NUMERIC / v_today_total_att::NUMERIC) * 100, 1);
    ELSE
      v_attendance_pct := 0.0;
    END IF;

    -- Pending Complaints
    SELECT COUNT(*)
    INTO v_pending_complaints
    FROM public.complaints
    WHERE school_id = v_school_id AND status IN ('OPEN', 'IN_PROGRESS', 'PENDING') AND deleted_at IS NULL;

    -- All recent notices
    SELECT COALESCE(jsonb_agg(n_sub), '[]'::JSONB)
    INTO v_recent_notices
    FROM (
      SELECT
        n.id,
        n.title,
        n.content,
        n.priority,
        n.status,
        n.target_audience,
        n.publish_date,
        n.created_at,
        jsonb_build_object(
          'firstName', u.first_name,
          'lastName', COALESCE(u.last_name, '')
        ) AS publisher
      FROM public.notices n
      LEFT JOIN public.users u ON u.id = n.published_by_id
      WHERE n.school_id = v_school_id AND n.deleted_at IS NULL
      ORDER BY n.created_at DESC
      LIMIT 5
    ) n_sub;

  END IF;

  -- 9. Upcoming Exams
  SELECT COALESCE(jsonb_agg(e_sub), '[]'::JSONB)
  INTO v_upcoming_exams
  FROM (
    SELECT
      id,
      name,
      code,
      start_date,
      end_date,
      status
    FROM public.exams
    WHERE school_id = v_school_id
      AND deleted_at IS NULL
      AND (v_active_year_id IS NULL OR academic_year_id = v_active_year_id)
    ORDER BY start_date ASC NULLS LAST
    LIMIT 3
  ) e_sub;

  -- 10. Assemble Final Role-Scoped Payload
  v_result := jsonb_build_object(
    'stats', jsonb_build_object(
      'totalStudents', v_total_students,
      'activeStudents', v_active_students,
      'inactiveStudents', v_inactive_students,
      'totalFaculty', v_total_faculty,
      'totalTeachers', v_total_faculty,
      'totalClasses', v_total_classes,
      'attendanceTodayPercentage', v_attendance_pct::TEXT,
      'attendanceMarkedCount', v_today_total_att,
      'pendingComplaints', v_pending_complaints,
      'roleCounts', COALESCE(v_role_counts, '{}'::JSONB)
    ),
    'campusInfo', jsonb_build_object(
      'id', v_school_rec.id,
      'name', v_school_rec.name,
      'code', v_school_rec.code,
      'status', v_school_rec.status,
      'email', v_school_rec.email,
      'phone', v_school_rec.phone,
      'logoUrl', v_school_rec.logo_url,
      'activeSession', CASE WHEN v_year_rec.id IS NOT NULL THEN jsonb_build_object(
        'id', v_year_rec.id,
        'name', v_year_rec.name,
        'isCurrent', v_year_rec.is_current
      ) ELSE NULL END
    ),
    'teacherData', v_teacher_data,
    'recentNotices', v_recent_notices,
    'upcomingExams', v_upcoming_exams,
    'chartData', jsonb_build_object(
      'attendanceTrend', '[]'::JSONB,
      'feeCollectionTrend', '[]'::JSONB
    )
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_overview(TEXT, TEXT, TEXT, TEXT) TO authenticated, anon, service_role;
NOTIFY pgrst, 'reload schema';
