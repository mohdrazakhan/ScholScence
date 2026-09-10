-- ============================================================================
-- SchoolSense Database Step 9, 10, 11, 12: Fees, Communication, Complaints & Audit
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. NOTICES & EVENTS (COMMUNICATION)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES school.academic_years(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    published_by UUID NOT NULL REFERENCES identity.users(id),
    target_audience VARCHAR(30) NOT NULL DEFAULT 'ALL', -- 'ALL', 'CLASS', 'SECTION', 'TEACHERS', 'GUARDIANS'
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_notices_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

CREATE TABLE IF NOT EXISTS school.notice_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID NOT NULL REFERENCES school.notices(id) ON DELETE CASCADE,
    class_id UUID REFERENCES school.classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES school.sections(id) ON DELETE CASCADE,
    role_id UUID REFERENCES identity.roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS school.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES school.academic_years(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location VARCHAR(150),
    is_holiday BOOLEAN NOT NULL DEFAULT false,
    target_audience VARCHAR(30) NOT NULL DEFAULT 'ALL',
    created_by UUID NOT NULL REFERENCES identity.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. COMPLAINTS & GRIEVANCES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50) NOT NULL,
    guardian_id UUID NOT NULL REFERENCES school.guardians(id) ON DELETE CASCADE,
    student_id UUID REFERENCES school.students(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL, -- 'ACADEMIC', 'TRANSPORT', 'FEES', 'DISCIPLINE', 'GENERAL'
    subject VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    assigned_to UUID REFERENCES identity.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_complaints_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    CONSTRAINT chk_complaints_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'))
);

CREATE TABLE IF NOT EXISTS school.complaint_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES school.complaints(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES identity.users(id),
    message TEXT NOT NULL,
    is_internal_note BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. FEES MANAGEMENT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school.fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- 'Tuition Fee', 'Transport Fee', 'Annual Fee', 'Lab Fee'
    code VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_fee_cat_school_code UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS school.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES school.academic_years(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES school.classes(id) ON DELETE CASCADE,
    fee_category_id UUID NOT NULL REFERENCES school.fee_categories(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    due_date DATE,
    frequency VARCHAR(30) NOT NULL DEFAULT 'MONTHLY', -- 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_fee_structure UNIQUE (academic_year_id, class_id, fee_category_id)
);

CREATE TABLE IF NOT EXISTS school.student_fee_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES school.academic_years(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES school.students(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PARTIAL', 'PAID', 'OVERDUE'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_invoice_num UNIQUE (school_id, invoice_number)
);

-- ----------------------------------------------------------------------------
-- 4. NOTIFICATION DELIVERIES & USAGE TRACKING (COST CONTROL)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school.notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'ATTENDANCE_ABSENT', 'HOMEWORK_PUBLISHED', 'NOTICE', 'EXAM_RESULT'
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school.notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_event_id UUID NOT NULL REFERENCES school.notification_events(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES identity.users(id),
    channel VARCHAR(30) NOT NULL, -- 'PUSH', 'WHATSAPP', 'SMS', 'EMAIL'
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'DELIVERED', 'FAILED'
    provider_id VARCHAR(100),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school.communication_usage_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    channel VARCHAR(30) NOT NULL, -- 'WHATSAPP', 'SMS'
    message_count INTEGER NOT NULL DEFAULT 1,
    unit_cost_inr NUMERIC(6, 4) NOT NULL DEFAULT 0.0000,
    total_cost_inr NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
    billing_month VARCHAR(7) NOT NULL, -- '2026-09'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES identity.users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    changes_json JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_school_resource ON school.audit_logs (school_id, resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON school.audit_logs (school_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. SEED DEMO COMMUNICATION & COMPLAINT DATA
-- ----------------------------------------------------------------------------
-- Seed School Notice
INSERT INTO school.notices (
    id, school_id, academic_year_id, title, content, published_by, target_audience, status
)
SELECT 
    '44444444-5555-6666-7777-888888888888',
    s.id,
    ay.id,
    'Parent-Teacher Meeting (PTM) Scheduled for Grade 8',
    'Dear Parents, The first term Parent-Teacher Meeting is scheduled for next Saturday from 9:00 AM to 1:00 PM.',
    u.id,
    'CLASS',
    'PUBLISHED'
FROM school.schools s
JOIN school.academic_years ay ON ay.school_id = s.id AND ay.is_current = true
JOIN identity.users u ON u.email = 'admin@demo-school.com'
WHERE s.code = 'DIS001'
ON CONFLICT (id) DO NOTHING;

-- Seed Parent Complaint / Grievance Ticket
INSERT INTO school.complaints (
    id, school_id, ticket_number, guardian_id, student_id, category, subject, status, priority, created_at
)
SELECT 
    '55555555-6666-7777-8888-999999999999',
    s.id,
    'TKT-2026-001',
    g.id,
    st.id,
    'ACADEMIC',
    'Clarification on Mathematics syllabus for Term 1 Mid-Term',
    'OPEN',
    'MEDIUM',
    now()
FROM school.schools s
JOIN school.guardians g ON g.school_id = s.id AND g.email = 'parent@demo-school.com'
JOIN school.students st ON st.school_id = s.id AND st.admission_number = 'ADM001'
WHERE s.code = 'DIS001'
ON CONFLICT (id) DO NOTHING;
