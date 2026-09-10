-- ============================================================================
-- SchoolSense Database Step 1: Demo Subjects & Class 8 Subject Mappings
-- ============================================================================

-- 1. Insert Standard Subjects for Demo International School
INSERT INTO school.subjects (id, school_id, name, code, subject_type, display_order, status)
SELECT 
    gen_random_uuid(),
    s.id,
    subj.name,
    subj.code,
    subj.subject_type,
    subj.display_order,
    'ACTIVE'
FROM school.schools s
CROSS JOIN (
    VALUES 
        ('Mathematics', 'MATH', 'ACADEMIC', 1),
        ('Science', 'SCI', 'ACADEMIC', 2),
        ('English', 'ENG', 'LANGUAGE', 3),
        ('Hindi', 'HIN', 'LANGUAGE', 4),
        ('Social Science', 'SST', 'ACADEMIC', 5),
        ('Computer Science', 'CS', 'ELECTIVE', 6),
        ('Physical Education', 'PE', 'ACTIVITY', 7),
        ('Art & Craft', 'ART', 'ACTIVITY', 8)
) AS subj(name, code, subject_type, display_order)
WHERE s.code = 'DIS001'
ON CONFLICT (school_id, code) DO NOTHING;

-- 2. Map Subjects to Class 8 for Academic Year 2026-27
INSERT INTO school.class_subjects (id, academic_year_id, class_id, subject_id, is_optional, display_order, status)
SELECT 
    gen_random_uuid(),
    ay.id AS academic_year_id,
    c.id AS class_id,
    sub.id AS subject_id,
    false AS is_optional,
    sub.display_order,
    'ACTIVE'
FROM school.schools s
JOIN school.academic_years ay ON ay.school_id = s.id AND ay.is_current = true
JOIN school.classes c ON c.school_id = s.id AND c.code = 'CLASS_8'
JOIN school.subjects sub ON sub.school_id = s.id
WHERE s.code = 'DIS001'
ON CONFLICT (academic_year_id, class_id, subject_id) DO NOTHING;

-- 3. Assign Rahul Sharma as Subject Teacher for Mathematics in Class 8 - Section A
INSERT INTO school.section_subject_teacher_assignments (
    id, school_id, academic_year_id, section_id, class_subject_id, user_id, status, assigned_at
)
SELECT 
    gen_random_uuid(),
    s.id AS school_id,
    ay.id AS academic_year_id,
    sec.id AS section_id,
    cs.id AS class_subject_id,
    u.id AS user_id,
    'ACTIVE',
    now()
FROM school.schools s
JOIN school.academic_years ay ON ay.school_id = s.id AND ay.is_current = true
JOIN school.classes c ON c.school_id = s.id AND c.code = 'CLASS_8'
JOIN school.sections sec ON sec.class_id = c.id AND sec.academic_year_id = ay.id AND sec.code = 'A'
JOIN school.subjects sub ON sub.school_id = s.id AND sub.code = 'MATH'
JOIN school.class_subjects cs ON cs.class_id = c.id AND cs.subject_id = sub.id AND cs.academic_year_id = ay.id
JOIN identity.users u ON u.email = 'teacher@demo-school.com'
WHERE s.code = 'DIS001'
ON CONFLICT DO NOTHING;
