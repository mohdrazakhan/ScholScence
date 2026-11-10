-- ============================================================================
-- School Documents & Official Certificate Registry with QR Verification
-- Supports: Transfer Certificate (TC), Bonafide, Character, No Dues, Marksheets
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.school_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  serial_number VARCHAR(100) NOT NULL,
  document_type VARCHAR(50) NOT NULL, -- 'TRANSFER_CERTIFICATE', 'BONAFIDE_CERTIFICATE', 'CHARACTER_CERTIFICATE', 'FEE_NO_DUES', 'MARKSHEET', 'REPORT_CARD', 'CUSTOM'
  title VARCHAR(200) NOT NULL,
  recipient_type VARCHAR(20) NOT NULL DEFAULT 'STUDENT', -- 'STUDENT', 'STAFF', 'OTHER'
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  recipient_name VARCHAR(200) NOT NULL,
  admission_number VARCHAR(100),
  class_name VARCHAR(100),
  section_name VARCHAR(100),
  roll_number VARCHAR(50),
  guardian_name VARCHAR(200),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issued_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ISSUED', -- 'ISSUED', 'REVOKED'
  revocation_reason TEXT,
  revoked_at TIMESTAMPTZ,
  verification_token VARCHAR(100) NOT NULL UNIQUE,
  remarks TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_school_document_serial UNIQUE (school_id, serial_number)
);

CREATE INDEX IF NOT EXISTS idx_school_documents_school ON public.school_documents(school_id);
CREATE INDEX IF NOT EXISTS idx_school_documents_student ON public.school_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_school_documents_token ON public.school_documents(verification_token);
CREATE INDEX IF NOT EXISTS idx_school_documents_serial ON public.school_documents(serial_number);
CREATE INDEX IF NOT EXISTS idx_school_documents_type ON public.school_documents(document_type);

-- RLS
ALTER TABLE public.school_documents ENABLE ROW LEVEL SECURITY;

-- Staff Policy (Read/Write school documents)
DROP POLICY IF EXISTS "Staff can manage school documents" ON public.school_documents;
CREATE POLICY "Staff can manage school documents"
  ON public.school_documents
  FOR ALL
  TO authenticated, anon
  USING (
    school_id = current_school_id()
    OR is_platform_admin()
  )
  WITH CHECK (
    school_id = current_school_id()
    OR is_platform_admin()
  );

-- Parents Policy (Can view their own children's documents)
DROP POLICY IF EXISTS "Parents can view child documents" ON public.school_documents;
CREATE POLICY "Parents can view child documents"
  ON public.school_documents
  FOR SELECT
  TO authenticated, anon
  USING (
    student_id IS NOT NULL AND parent_can_access_student(student_id)
  );

-- Anonymous Public Verification RPC
-- Callable without credentials to verify QR code scan results
CREATE OR REPLACE FUNCTION public.verify_issued_document(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_doc RECORD;
  v_school RECORD;
  v_result JSONB;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token is required');
  END IF;

  SELECT d.*
    INTO v_doc
    FROM public.school_documents d
   WHERE (d.verification_token = p_token OR d.serial_number = p_token)
     AND d.deleted_at IS NULL
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Document not found or invalid QR code');
  END IF;

  SELECT s.id, s.name, s.code, s.logo_url, s.city, s.state, s.affiliation_number, s.board, s.email, s.phone
    INTO v_school
    FROM public.schools s
   WHERE s.id = v_doc.school_id
   LIMIT 1;

  v_result := jsonb_build_object(
    'success', true,
    'verified', true,
    'document', jsonb_build_object(
      'id', v_doc.id,
      'serialNumber', v_doc.serial_number,
      'documentType', v_doc.document_type,
      'title', v_doc.title,
      'recipientName', v_doc.recipient_name,
      'admissionNumber', v_doc.admission_number,
      'className', v_doc.class_name,
      'sectionName', v_doc.section_name,
      'rollNumber', v_doc.roll_number,
      'guardianName', v_doc.guardian_name,
      'issueDate', v_doc.issue_date,
      'status', v_doc.status,
      'revocationReason', v_doc.revocation_reason,
      'remarks', v_doc.remarks,
      'metadata', v_doc.metadata,
      'createdAt', v_doc.created_at
    ),
    'school', jsonb_build_object(
      'name', v_school.name,
      'code', v_school.code,
      'logoUrl', v_school.logo_url,
      'city', v_school.city,
      'state', v_school.state,
      'affiliationNumber', v_school.affiliation_number,
      'board', v_school.board,
      'email', v_school.email,
      'phone', v_school.phone
    )
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_issued_document(TEXT) TO anon, authenticated, service_role;
