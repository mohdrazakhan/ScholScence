-- ==============================================================================
-- Supabase RPC Function: get_dashboard_overview
-- Consolidates all Admin Dashboard data into 1 single fast Cloud API call
-- Replaces 10-20 separate client queries with 1 single serverless database call.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_overview(
  p_school_id UUID,
  p_academic_year_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_school_rec RECORD;
  v_year_rec RECORD;
  v_active_year_id UUID := p_academic_year_id;
  v_active_students INT := 0;
  v_inactive_students INT := 0;
  v_total_students INT := 0;
  v_total_classes INT := 0;
  v_total_faculty INT := 0;
  v_today_date DATE := CURRENT_DATE;
  v_today_present INT := 0;
  v_today_total_att INT := 0;
  v_attendance_pct NUMERIC(5, 1) := 0.0;
  v_pending_complaints INT := 0;
  v_role_counts JSONB := '{}'::JSONB;
  v_recent_notices JSONB := '[]'::JSONB;
  v_upcoming_exams JSONB := '[]'::JSONB;
  v_result JSONB;
BEGIN
  -- 1. School Information
  SELECT id, name, code, status, email, phone, city, state, logo_url
  INTO v_school_rec
  FROM public.schools
  WHERE id = p_school_id AND deleted_at IS NULL;

  -- 2. Resolve Academic Session
  IF v_active_year_id IS NULL THEN
    SELECT id, name, is_current
    INTO v_year_rec
    FROM public.academic_years
    WHERE school_id = p_school_id AND is_current = TRUE AND deleted_at IS NULL
    LIMIT 1;

    IF v_year_rec.id IS NOT NULL THEN
      v_active_year_id := v_year_rec.id;
    ELSE
      SELECT id, name, is_current
      INTO v_year_rec
      FROM public.academic_years
      WHERE school_id = p_school_id AND deleted_at IS NULL
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

  -- 3. Student Counts (Filtered by academic year enrollment)
  IF v_active_year_id IS NOT NULL THEN
    SELECT
      COUNT(DISTINCT CASE WHEN se.status = 'ACTIVE' AND s.status = 'ACTIVE' AND s.deleted_at IS NULL THEN s.id END),
      COUNT(DISTINCT CASE WHEN se.status != 'ACTIVE' OR s.status != 'ACTIVE' OR s.deleted_at IS NOT NULL THEN s.id END),
      COUNT(DISTINCT s.id)
    INTO v_active_students, v_inactive_students, v_total_students
    FROM public.student_enrollments se
    JOIN public.students s ON s.id = se.student_id
    WHERE se.academic_year_id = v_active_year_id AND s.school_id = p_school_id;
  ELSE
    SELECT
      COUNT(CASE WHEN status = 'ACTIVE' AND deleted_at IS NULL THEN 1 END),
      COUNT(CASE WHEN status != 'ACTIVE' OR deleted_at IS NOT NULL THEN 1 END),
      COUNT(*)
    INTO v_active_students, v_inactive_students, v_total_students
    FROM public.students
    WHERE school_id = p_school_id;
  END IF;

  -- 4. Classes count
  SELECT COUNT(*)
  INTO v_total_classes
  FROM public.classes
  WHERE school_id = p_school_id AND deleted_at IS NULL;

  -- 5. Faculty & Staff Counts (Grouped by role code)
  SELECT
    COUNT(DISTINCT usr.user_id),
    COALESCE(jsonb_object_agg(COALESCE(r.code, 'STAFF'), role_count), '{}'::JSONB)
  INTO v_total_faculty, v_role_counts
  FROM (
    SELECT usr.role_id, COUNT(DISTINCT usr.user_id) AS role_count
    FROM public.user_school_roles usr
    WHERE usr.school_id = p_school_id AND usr.status = 'ACTIVE' AND usr.deleted_at IS NULL
    GROUP BY usr.role_id
  ) role_agg
  JOIN public.roles r ON r.id = role_agg.role_id
  JOIN public.user_school_roles usr ON usr.school_id = p_school_id AND usr.status = 'ACTIVE' AND usr.deleted_at IS NULL;

  -- 6. Today's Attendance Percentage
  SELECT
    COUNT(CASE WHEN status IN ('PRESENT', 'LATE', 'HALF_DAY') THEN 1 END),
    COUNT(*)
  INTO v_today_present, v_today_total_att
  FROM public.attendance
  WHERE school_id = p_school_id AND date = v_today_date;

  IF v_today_total_att > 0 THEN
    v_attendance_pct := ROUND((v_today_present::NUMERIC / v_today_total_att::NUMERIC) * 100, 1);
  ELSE
    v_attendance_pct := 0.0;
  END IF;

  -- 7. Pending Complaints
  SELECT COUNT(*)
  INTO v_pending_complaints
  FROM public.complaints
  WHERE school_id = p_school_id AND status IN ('OPEN', 'IN_PROGRESS', 'PENDING') AND deleted_at IS NULL;

  -- 8. Recent 5 Notices
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
    WHERE n.school_id = p_school_id AND n.deleted_at IS NULL
    ORDER BY n.created_at DESC
    LIMIT 5
  ) n_sub;

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
    WHERE school_id = p_school_id
      AND deleted_at IS NULL
      AND (v_active_year_id IS NULL OR academic_year_id = v_active_year_id)
    ORDER BY start_date ASC NULLS LAST
    LIMIT 3
  ) e_sub;

  -- 10. Assemble Final Unified Payload matching DashboardStats interface
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

-- Grant execution permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_dashboard_overview(UUID, UUID) TO authenticated, anon, service_role;
