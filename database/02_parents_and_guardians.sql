-- ============================================================================
-- SchoolSense Database Step 5: Parents & Guardians Architecture
-- ============================================================================

-- 0. Add Unique Indexes to identity.users if not present
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_active ON identity.users (email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone_active ON identity.users (phone) WHERE deleted_at IS NULL;

-- 1. Ensure GUARDIAN role exists in identity.roles
INSERT INTO identity.roles (id, name, code, description, is_system_role, status)
SELECT 
    gen_random_uuid(),
    'Guardian / Parent',
    'GUARDIAN',
    'Parent or legal guardian of enrolled students',
    true,
    'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM identity.roles WHERE code = 'GUARDIAN' AND is_system_role = true AND deleted_at IS NULL
);

-- 2. Create school.guardians table
CREATE TABLE IF NOT EXISTS school.guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    occupation VARCHAR(100),
    annual_income NUMERIC(12, 2),
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_guardians_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_guardians_school_phone ON school.guardians (school_id, phone);

-- 3. Create school.student_guardians relationship table
CREATE TABLE IF NOT EXISTS school.student_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES school.students(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES school.guardians(id) ON DELETE CASCADE,
    relationship_type VARCHAR(30) NOT NULL, -- 'FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER'
    is_primary_contact BOOLEAN NOT NULL DEFAULT false,
    is_emergency_contact BOOLEAN NOT NULL DEFAULT false,
    can_pickup BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_student_guardians_relationship CHECK (relationship_type IN ('FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER')),
    CONSTRAINT chk_student_guardians_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_student_guardian 
ON school.student_guardians (student_id, guardian_id) 
WHERE status = 'ACTIVE' AND deleted_at IS NULL;

-- 4. Seed Demo Parent Account (Rajesh Sharma, Father of Aarav Sharma)
-- User account in identity.users
INSERT INTO identity.users (
    id, email, phone, password_hash, first_name, last_name, status
) 
SELECT 
    '8a3e7b12-9c45-42a1-b8ef-1234567890ab',
    'parent@demo-school.com',
    '9876543212',
    '$2a$06$9jqQMCbqqyW6vwa24VKIVeU9uM7ckhNj0RyNl4lfxV3Q7u4Dihj1m', -- Demo password
    'Rajesh',
    'Sharma',
    'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM identity.users WHERE email = 'parent@demo-school.com' AND deleted_at IS NULL
);

-- Map parent to school with GUARDIAN role
INSERT INTO identity.user_school_roles (id, user_id, school_id, role_id, status)
SELECT 
    gen_random_uuid(),
    u.id,
    s.id,
    r.id,
    'ACTIVE'
FROM identity.users u
CROSS JOIN school.schools s
CROSS JOIN identity.roles r
WHERE u.email = 'parent@demo-school.com' 
  AND s.code = 'DIS001' 
  AND r.code = 'GUARDIAN'
ON CONFLICT (user_id, school_id, role_id) DO NOTHING;

-- Create Guardian record linked to user
INSERT INTO school.guardians (
    id, school_id, user_id, first_name, last_name, phone, email, occupation, status
)
SELECT 
    'f3b4c5d6-e7f8-4123-9abc-def012345678',
    s.id,
    u.id,
    'Rajesh',
    'Sharma',
    '9876543212',
    'parent@demo-school.com',
    'Software Engineer',
    'ACTIVE'
FROM school.schools s
JOIN identity.users u ON u.email = 'parent@demo-school.com'
WHERE s.code = 'DIS001'
  AND NOT EXISTS (
      SELECT 1 FROM school.guardians WHERE id = 'f3b4c5d6-e7f8-4123-9abc-def012345678'
  );

-- Link Guardian to Aarav Sharma (Student)
INSERT INTO school.student_guardians (
    id, school_id, student_id, guardian_id, relationship_type, is_primary_contact, is_emergency_contact, can_pickup, status
)
SELECT 
    gen_random_uuid(),
    s.id,
    st.id,
    g.id,
    'FATHER',
    true,
    true,
    true,
    'ACTIVE'
FROM school.schools s
JOIN school.students st ON st.school_id = s.id AND st.admission_number = 'ADM001'
JOIN school.guardians g ON g.school_id = s.id AND g.email = 'parent@demo-school.com'
WHERE s.code = 'DIS001'
  AND NOT EXISTS (
      SELECT 1 FROM school.student_guardians sg WHERE sg.student_id = st.id AND sg.guardian_id = g.id
  );
