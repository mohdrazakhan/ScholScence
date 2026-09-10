-- ============================================================================
-- SchoolSense Database Step 6, 7, 8: Attendance, Homework, Exams & Marks
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ATTENDANCE MODULE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES school.academic_years(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES school.students(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES school.sections(id) ON DELETE CASCADE,
    class_subject_id UUID REFERENCES school.class_subjects(id) ON DELETE SET NULL, -- NULL = Daily General Attendance
    date DATE NOT NULL,
    period_number INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'PRESENT', -- 'PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED'
    reason TEXT,
    marked_by UUID NOT NULL REFERENCES identity.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_attendance_status CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON school.attendance (school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON school.attendance (student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_section_date ON school.attendance (section_id, date);

-- Unique daily attendance per student
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_attendance_student_date 
ON school.attendance (student_id, academic_year_id, date) 
WHERE class_subject_id IS NULL AND deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 2. HOMEWORK MODULE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school.homework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES school.academic_years(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES school.sections(id) ON DELETE CASCADE,
    class_subject_id UUID NOT NULL REFERENCES school.class_subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES identity.users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_homework_dates CHECK (due_date >= assigned_date),
    CONSTRAINT chk_homework_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS idx_homework_section_due ON school.homework (section_id, due_date);

CREATE TABLE IF NOT EXISTS school.homework_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    homework_id UUID NOT NULL REFERENCES school.homework(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    file_type VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. EXAMS & MARKS MODULE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school.grading_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    grades_json JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS school.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES school.academic_years(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    grading_scheme_id UUID REFERENCES school.grading_schemes(id),
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_exams_status CHECK (status IN ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'PUBLISHED'))
);

CREATE TABLE IF NOT EXISTS school.exam_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES school.exams(id) ON DELETE CASCADE,
    class_subject_id UUID NOT NULL REFERENCES school.class_subjects(id) ON DELETE CASCADE,
    exam_date DATE,
    start_time TIME,
    end_time TIME,
    max_marks NUMERIC(6, 2) NOT NULL DEFAULT 100.00,
    passing_marks NUMERIC(6, 2) NOT NULL DEFAULT 33.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_exam_class_subject UNIQUE (exam_id, class_subject_id)
);

CREATE TABLE IF NOT EXISTS school.student_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    exam_subject_id UUID NOT NULL REFERENCES school.exam_subjects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES school.students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(6, 2),
    is_absent BOOLEAN NOT NULL DEFAULT false,
    grade VARCHAR(10),
    remarks TEXT,
    entered_by UUID NOT NULL REFERENCES identity.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_exam_student_marks UNIQUE (exam_subject_id, student_id)
);

-- ----------------------------------------------------------------------------
-- 4. SEED SAMPLE DATA FOR ATTENDANCE, HOMEWORK, AND EXAMS
-- ----------------------------------------------------------------------------

-- Seed Grading Scheme
INSERT INTO school.grading_schemes (id, school_id, name, description, grades_json)
SELECT 
    '11111111-2222-3333-4444-555555555555',
    s.id,
    'CBSE 9-Point Scale',
    'Standard CBSE secondary grading scale',
    '[
        {"grade": "A1", "min_percent": 91, "max_percent": 100, "grade_point": 10.0},
        {"grade": "A2", "min_percent": 81, "max_percent": 90, "grade_point": 9.0},
        {"grade": "B1", "min_percent": 71, "max_percent": 80, "grade_point": 8.0},
        {"grade": "B2", "min_percent": 61, "max_percent": 70, "grade_point": 7.0},
        {"grade": "C1", "min_percent": 51, "max_percent": 60, "grade_point": 6.0},
        {"grade": "C2", "min_percent": 41, "max_percent": 50, "grade_point": 5.0},
        {"grade": "D", "min_percent": 33, "max_percent": 40, "grade_point": 4.0},
        {"grade": "E", "min_percent": 0, "max_percent": 32, "grade_point": 0.0}
    ]'::jsonb
FROM school.schools s
WHERE s.code = 'DIS001'
ON CONFLICT (id) DO NOTHING;

-- Seed Attendance for Aarav Sharma (Past 3 days: Present, Present, Present)
INSERT INTO school.attendance (
    school_id, academic_year_id, student_id, section_id, date, status, marked_by
)
SELECT 
    s.id,
    ay.id,
    st.id,
    sec.id,
    d.att_date,
    'PRESENT',
    u.id
FROM school.schools s
JOIN school.academic_years ay ON ay.school_id = s.id AND ay.is_current = true
JOIN school.students st ON st.school_id = s.id AND st.admission_number = 'ADM001'
JOIN school.student_enrollments se ON se.student_id = st.id AND se.academic_year_id = ay.id
JOIN school.sections sec ON se.section_id = sec.id
JOIN identity.users u ON u.email = 'teacher@demo-school.com'
CROSS JOIN (
    VALUES (CURRENT_DATE - INTERVAL '2 day'), (CURRENT_DATE - INTERVAL '1 day'), (CURRENT_DATE)
) AS d(att_date)
WHERE s.code = 'DIS001'
ON CONFLICT DO NOTHING;

-- Seed Homework by Rahul Sharma for Class 8-A Mathematics
INSERT INTO school.homework (
    id, school_id, academic_year_id, section_id, class_subject_id, teacher_id, title, description, assigned_date, due_date, status
)
SELECT 
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    s.id,
    ay.id,
    sec.id,
    cs.id,
    u.id,
    'Chapter 3: Linear Equations in One Variable - Exercise 3.1 & 3.2',
    'Solve questions 1 to 10 from Exercise 3.1 and questions 1 to 5 from Exercise 3.2 in your class homework notebook.',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '2 day',
    'PUBLISHED'
FROM school.schools s
JOIN school.academic_years ay ON ay.school_id = s.id AND ay.is_current = true
JOIN school.classes c ON c.school_id = s.id AND c.code = 'CLASS_8'
JOIN school.sections sec ON sec.class_id = c.id AND sec.academic_year_id = ay.id AND sec.code = 'A'
JOIN school.subjects sub ON sub.school_id = s.id AND sub.code = 'MATH'
JOIN school.class_subjects cs ON cs.class_id = c.id AND cs.subject_id = sub.id AND cs.academic_year_id = ay.id
JOIN identity.users u ON u.email = 'teacher@demo-school.com'
WHERE s.code = 'DIS001'
ON CONFLICT (id) DO NOTHING;

-- Seed Term 1 Exam
INSERT INTO school.exams (
    id, school_id, academic_year_id, name, code, start_date, end_date, grading_scheme_id, status
)
SELECT 
    '22222222-3333-4444-5555-666666666666',
    s.id,
    ay.id,
    'Term 1 Mid-Term Assessment 2026',
    'TERM_1_2026',
    CURRENT_DATE + INTERVAL '10 day',
    CURRENT_DATE + INTERVAL '20 day',
    '11111111-2222-3333-4444-555555555555',
    'SCHEDULED'
FROM school.schools s
JOIN school.academic_years ay ON ay.school_id = s.id AND ay.is_current = true
WHERE s.code = 'DIS001'
ON CONFLICT (id) DO NOTHING;

-- Seed Exam Subject for Class 8 Mathematics
INSERT INTO school.exam_subjects (
    id, exam_id, class_subject_id, exam_date, start_time, end_time, max_marks, passing_marks, status
)
SELECT 
    '33333333-4444-5555-6666-777777777777',
    '22222222-3333-4444-5555-666666666666',
    cs.id,
    CURRENT_DATE + INTERVAL '12 day',
    '09:00:00',
    '12:00:00',
    100.00,
    33.00,
    'ACTIVE'
FROM school.schools s
JOIN school.academic_years ay ON ay.school_id = s.id AND ay.is_current = true
JOIN school.classes c ON c.school_id = s.id AND c.code = 'CLASS_8'
JOIN school.subjects sub ON sub.school_id = s.id AND sub.code = 'MATH'
JOIN school.class_subjects cs ON cs.class_id = c.id AND cs.subject_id = sub.id AND cs.academic_year_id = ay.id
WHERE s.code = 'DIS001'
ON CONFLICT (exam_id, class_subject_id) DO NOTHING;
