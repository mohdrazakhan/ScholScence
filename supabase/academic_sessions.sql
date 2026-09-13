-- ==============================================================================
-- ACADEMIC SESSIONS, STUDENT PROMOTION ROLLOVER & ALUMNI ENGINE
-- ScholScence Multi-Tenant SaaS Platform
-- ==============================================================================

-- 1. Get all academic sessions for a school with enrollment metrics
CREATE OR REPLACE FUNCTION public.get_school_academic_sessions(p_school_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ay.id,
      'school_id', ay.school_id,
      'name', ay.name,
      'start_date', ay.start_date,
      'end_date', ay.end_date,
      'is_current', ay.is_current,
      'status', ay.status,
      'created_at', ay.created_at,
      'student_count', COALESCE(
        (SELECT COUNT(DISTINCT se.student_id) 
         FROM public.student_enrollments se 
         WHERE se.academic_year_id = ay.id AND se.status = 'ACTIVE'), 0
      ),
      'section_count', COALESCE(
        (SELECT COUNT(sec.id) 
         FROM public.sections sec 
         WHERE sec.academic_year_id = ay.id AND sec.status = 'ACTIVE'), 0
      )
    ) ORDER BY ay.start_date DESC
  ) INTO v_result
  FROM public.academic_years ay
  WHERE ay.school_id = p_school_id AND ay.deleted_at IS NULL;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 2. Create a new academic session
CREATE OR REPLACE FUNCTION public.create_academic_session(
  p_school_id UUID,
  p_name VARCHAR(20),
  p_start_date DATE,
  p_end_date DATE,
  p_set_as_current BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check if session with name already exists
  SELECT id INTO v_existing_id
  FROM public.academic_years
  WHERE school_id = p_school_id AND name = p_name AND deleted_at IS NULL;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'An academic session with this name already exists.');
  END IF;

  -- If set as current, unset any existing current session
  IF p_set_as_current THEN
    UPDATE public.academic_years
    SET is_current = FALSE, updated_at = NOW()
    WHERE school_id = p_school_id;
  END IF;

  -- Insert new academic year
  INSERT INTO public.academic_years (
    school_id,
    name,
    start_date,
    end_date,
    is_current,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_school_id,
    p_name,
    p_start_date,
    p_end_date,
    p_set_as_current,
    'ACTIVE',
    NOW(),
    NOW()
  ) RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'name', p_name,
    'is_current', p_set_as_current
  );
END;
$$;

-- 3. Rollover and Promote Students Engine (With Alumni Graduation)
CREATE OR REPLACE FUNCTION public.rollover_and_promote_students(
  p_school_id UUID,
  p_from_session_id UUID,
  p_to_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from_session_name VARCHAR(20);
  v_to_session_name VARCHAR(20);
  v_promoted_count INT := 0;
  v_graduated_count INT := 0;
  v_sections_created INT := 0;
  
  v_class_rec RECORD;
  v_sec_rec RECORD;
  v_student_rec RECORD;
  
  v_next_class_id UUID;
  v_next_class_name VARCHAR(100);
  v_next_sec_id UUID;
  v_max_display_order INT;
BEGIN
  -- Validate sessions
  SELECT name INTO v_from_session_name FROM public.academic_years WHERE id = p_from_session_id AND school_id = p_school_id;
  SELECT name INTO v_to_session_name FROM public.academic_years WHERE id = p_to_session_id AND school_id = p_school_id;

  IF v_from_session_name IS NULL OR v_to_session_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid source or destination academic session.');
  END IF;

  -- 1. Ensure all classes have corresponding sections provisioned in the new session
  FOR v_sec_rec IN
    SELECT s.name, s.code, s.capacity, s.display_order, s.class_id
    FROM public.sections s
    WHERE s.school_id = p_school_id AND s.academic_year_id = p_from_session_id AND s.deleted_at IS NULL
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.sections 
      WHERE school_id = p_school_id 
        AND academic_year_id = p_to_session_id 
        AND class_id = v_sec_rec.class_id 
        AND code = v_sec_rec.code
    ) THEN
      INSERT INTO public.sections (
        school_id,
        academic_year_id,
        class_id,
        name,
        code,
        capacity,
        display_order,
        status,
        created_at,
        updated_at
      ) VALUES (
        p_school_id,
        p_to_session_id,
        v_sec_rec.class_id,
        v_sec_rec.name,
        v_sec_rec.code,
        v_sec_rec.capacity,
        v_sec_rec.display_order,
        'ACTIVE',
        NOW(),
        NOW()
      );
      v_sections_created := v_sections_created + 1;
    END IF;
  END LOOP;

  -- 2. Determine highest class display_order in the school
  SELECT MAX(display_order) INTO v_max_display_order
  FROM public.classes
  WHERE school_id = p_school_id AND deleted_at IS NULL;

  -- 3. Loop over all active student enrollments in the from_session
  FOR v_student_rec IN
    SELECT 
      se.id AS enrollment_id,
      se.student_id,
      se.class_id,
      se.section_id,
      se.roll_number,
      c.display_order AS current_class_order,
      c.name AS current_class_name,
      sec.name AS current_sec_name,
      sec.code AS current_sec_code
    FROM public.student_enrollments se
    JOIN public.classes c ON c.id = se.class_id
    JOIN public.sections sec ON sec.id = se.section_id
    WHERE se.academic_year_id = p_from_session_id AND se.status = 'ACTIVE'
  LOOP
    -- Check if student was in the highest/final graduating class
    IF v_student_rec.current_class_order >= v_max_display_order THEN
      -- Graduate student to ALUMNI
      UPDATE public.students
      SET 
        status = 'ALUMNI',
        updated_at = NOW()
      WHERE id = v_student_rec.student_id;

      v_graduated_count := v_graduated_count + 1;
    ELSE
      -- Find the immediate next class by display_order
      SELECT id, name INTO v_next_class_id, v_next_class_name
      FROM public.classes
      WHERE school_id = p_school_id 
        AND display_order > v_student_rec.current_class_order 
        AND deleted_at IS NULL
      ORDER BY display_order ASC
      LIMIT 1;

      IF v_next_class_id IS NOT NULL THEN
        -- Find matching section in new session for next class
        SELECT id INTO v_next_sec_id
        FROM public.sections
        WHERE school_id = p_school_id 
          AND academic_year_id = p_to_session_id 
          AND class_id = v_next_class_id
          AND code = v_student_rec.current_sec_code;

        -- Fallback to any active section in next class if exact code is missing
        IF v_next_sec_id IS NULL THEN
          SELECT id INTO v_next_sec_id
          FROM public.sections
          WHERE school_id = p_school_id 
            AND academic_year_id = p_to_session_id 
            AND class_id = v_next_class_id
          ORDER BY display_order ASC
          LIMIT 1;
        END IF;

        IF v_next_sec_id IS NOT NULL THEN
          -- Check if already enrolled in destination session
          IF NOT EXISTS (
            SELECT 1 FROM public.student_enrollments
            WHERE student_id = v_student_rec.student_id AND academic_year_id = p_to_session_id
          ) THEN
            INSERT INTO public.student_enrollments (
              student_id,
              academic_year_id,
              class_id,
              section_id,
              roll_number,
              status,
              created_at,
              updated_at
            ) VALUES (
              v_student_rec.student_id,
              p_to_session_id,
              v_next_class_id,
              v_next_sec_id,
              v_student_rec.roll_number,
              'ACTIVE',
              NOW(),
              NOW()
            );

            v_promoted_count := v_promoted_count + 1;
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'from_session', v_from_session_name,
    'to_session', v_to_session_name,
    'promoted_count', v_promoted_count,
    'graduated_alumni_count', v_graduated_count,
    'sections_provisioned', v_sections_created
  );
END;
$$;

-- 4. Get Alumni Roster for a school
CREATE OR REPLACE FUNCTION public.get_school_alumni(p_school_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'student_id', st.id,
      'admission_number', st.admission_number,
      'first_name', st.first_name,
      'last_name', st.last_name,
      'full_name', TRIM(CONCAT(st.first_name, ' ', COALESCE(st.last_name, ''))),
      'gender', st.gender,
      'date_of_birth', st.date_of_birth,
      'status', st.status,
      'last_class_name', last_enr.class_name,
      'last_section_name', last_enr.section_name,
      'graduation_session', last_enr.session_name,
      'last_roll_number', last_enr.roll_number,
      'primary_contact', jsonb_build_object(
        'first_name', u.first_name,
        'last_name', u.last_name,
        'phone', u.phone,
        'email', u.email,
        'relationship', sg.relationship
      )
    ) ORDER BY last_enr.session_end_date DESC NULLS LAST, st.first_name ASC
  ) INTO v_result
  FROM public.students st
  LEFT JOIN LATERAL (
    SELECT 
      c.name AS class_name,
      sec.name AS section_name,
      ay.name AS session_name,
      ay.end_date AS session_end_date,
      se.roll_number
    FROM public.student_enrollments se
    JOIN public.classes c ON c.id = se.class_id
    JOIN public.sections sec ON sec.id = se.section_id
    JOIN public.academic_years ay ON ay.id = se.academic_year_id
    WHERE se.student_id = st.id
    ORDER BY ay.end_date DESC
    LIMIT 1
  ) last_enr ON true
  LEFT JOIN public.student_guardians sg ON sg.student_id = st.id AND sg.is_primary_contact = TRUE
  LEFT JOIN public.guardians g ON g.id = sg.guardian_id
  LEFT JOIN public.users u ON u.id = g.user_id
  WHERE st.school_id = p_school_id AND st.status = 'ALUMNI' AND st.deleted_at IS NULL;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
