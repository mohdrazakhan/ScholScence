-- ============================================================================
-- SchoolSense: Super Admin / Company Developer Role (Full System Access)
-- ============================================================================

-- 1. Insert SUPER_ADMIN role
INSERT INTO identity.roles (id, name, code, description, is_system_role, status)
SELECT 
    gen_random_uuid(),
    'Company Developer (Super Admin)',
    'SUPER_ADMIN',
    'Root platform superuser role with binary full access across all schools and features',
    true,
    'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM identity.roles WHERE code = 'SUPER_ADMIN' AND deleted_at IS NULL
);

-- 2. Assign ALL permissions to SUPER_ADMIN role
INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT 
    r.id AS role_id,
    p.id AS permission_id
FROM identity.roles r
CROSS JOIN identity.permissions p
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. Create Developer User Account (dev@schoolsense.in)
INSERT INTO identity.users (
    id, email, phone, password_hash, first_name, last_name, status
)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    'dev@schoolsense.in',
    '9999999999',
    '$2a$06$9jqQMCbqqyW6vwa24VKIVeU9uM7ckhNj0RyNl4lfxV3Q7u4Dihj1m', -- password123
    'Root',
    'Developer',
    'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM identity.users WHERE email = 'dev@schoolsense.in' AND deleted_at IS NULL
);

-- 4. Map Developer to Demo School with SUPER_ADMIN role
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
WHERE u.email = 'dev@schoolsense.in'
  AND s.code = 'DIS001'
  AND r.code = 'SUPER_ADMIN'
ON CONFLICT (user_id, school_id, role_id) DO NOTHING;
