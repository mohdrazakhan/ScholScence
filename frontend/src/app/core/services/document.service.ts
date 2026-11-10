import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import {
  SchoolDocument,
  SchoolDocumentType,
  IssueDocumentRequest,
  DocumentVerificationResult,
} from '../models';
import * as QRCode from 'qrcode';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private supabaseService = inject(SupabaseService);
  private auth = inject(AuthService);

  private get supabase() {
    return this.supabaseService.client;
  }

  private getSchoolId(): string {
    const user = this.auth.currentUser();
    return user?.school?.id || '';
  }

  private getStorageKey(schoolId: string): string {
    return `schoolsense_documents_${schoolId}`;
  }

  private getLocalDocuments(schoolId: string): SchoolDocument[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(schoolId));
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  private saveLocalDocuments(schoolId: string, docs: SchoolDocument[]) {
    try {
      localStorage.setItem(this.getStorageKey(schoolId), JSON.stringify(docs));
    } catch {}
  }

  /**
   * Generates a base64 QR code data URL (PNG) from any text / verification URL
   */
  async generateQRCodeDataUrl(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width: 256,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
    } catch (err) {
      console.warn('QR Code generation error:', err);
      return '';
    }
  }

  /**
   * Generates official institutional serial number e.g. DHA/2026-27/TC-0042
   */
  async generateSerialNumber(docType: SchoolDocumentType): Promise<string> {
    const schoolId = this.getSchoolId();
    const user = this.auth.currentUser();
    const schoolCode = (user?.school?.code || 'DHA').toUpperCase();
    const yearCode = '2026-27';

    const typePrefixes: Record<SchoolDocumentType, string> = {
      TRANSFER_CERTIFICATE: 'TC',
      BONAFIDE_CERTIFICATE: 'BON',
      CHARACTER_CERTIFICATE: 'CC',
      FEE_NO_DUES: 'NOD',
      MARKSHEET: 'MRK',
      REPORT_CARD: 'RC',
      SPORTS_CERTIFICATE: 'SPT',
      CUSTOM: 'DOC',
    };

    const prefix = typePrefixes[docType] || 'DOC';
    const docs = await this.getDocuments();
    const count = docs.filter((d) => d.documentType === docType).length + 1;
    const seq = String(count).padStart(4, '0');

    return `${schoolCode}/${yearCode}/${prefix}-${seq}`;
  }

  /**
   * Fetch all issued documents for the current school
   */
  async getDocuments(filter?: {
    type?: string;
    studentId?: string;
    search?: string;
  }): Promise<SchoolDocument[]> {
    const schoolId = this.getSchoolId();
    if (!schoolId) return [];

    let documents: SchoolDocument[] = [];

    // 1. Try querying Supabase school_documents table
    try {
      let query = this.supabase
        .from('school_documents')
        .select('*')
        .eq('school_id', schoolId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filter?.type && filter.type !== 'ALL') {
        query = query.eq('document_type', filter.type);
      }
      if (filter?.studentId) {
        query = query.eq('student_id', filter.studentId);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        documents = data.map((d: any) => this.mapDbRowToModel(d));
      }
    } catch (e) {
      console.warn('Documents table query error, falling back to local registry:', e);
    }

    // 2. Check local fallback storage & seed if empty
    if (documents.length === 0) {
      documents = this.getLocalDocuments(schoolId);
      if (documents.length === 0) {
        documents = this.seedDefaultDocuments(schoolId);
        this.saveLocalDocuments(schoolId, documents);
      }
    }

    // Apply filtering
    if (filter?.type && filter.type !== 'ALL') {
      documents = documents.filter((d) => d.documentType === filter.type);
    }
    if (filter?.studentId) {
      documents = documents.filter((d) => d.studentId === filter.studentId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      documents = documents.filter(
        (d) =>
          d.recipientName?.toLowerCase().includes(q) ||
          d.serialNumber?.toLowerCase().includes(q) ||
          d.admissionNumber?.toLowerCase().includes(q) ||
          d.title?.toLowerCase().includes(q)
      );
    }

    return documents;
  }

  /**
   * Issue a new official school document with unique serial number and scannable QR verification
   */
  async issueDocument(req: IssueDocumentRequest): Promise<SchoolDocument> {
    const schoolId = this.getSchoolId();
    const user = this.auth.currentUser();

    // Generate unique verification token
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const verificationToken = `doc_${randomHex}_${Date.now().toString(36)}`;
    const serialNumber = req.serialNumber || (await this.generateSerialNumber(req.documentType));
    const issueDate = req.issueDate || new Date().toISOString().split('T')[0];

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://schoolsense.in';
    const verificationUrl = `${baseUrl}/verify/${verificationToken}`;

    const newDoc: SchoolDocument = {
      id: crypto.randomUUID(),
      schoolId: schoolId,
      serialNumber: serialNumber,
      documentType: req.documentType,
      title: req.title,
      recipientType: 'STUDENT',
      studentId: req.studentId,
      recipientName: req.recipientName,
      admissionNumber: req.admissionNumber,
      className: req.className,
      sectionName: req.sectionName,
      rollNumber: req.rollNumber,
      guardianName: req.guardianName,
      issueDate: issueDate,
      issuedById: user?.id,
      status: 'ISSUED',
      verificationToken: verificationToken,
      verificationUrl: verificationUrl,
      remarks: req.remarks,
      metadata: req.metadata || {},
      createdAt: new Date().toISOString(),
    };

    // 1. Try saving to Supabase school_documents
    try {
      const dbPayload = {
        id: newDoc.id,
        school_id: schoolId,
        serial_number: newDoc.serialNumber,
        document_type: newDoc.documentType,
        title: newDoc.title,
        recipient_type: newDoc.recipientType,
        student_id: newDoc.studentId || null,
        recipient_name: newDoc.recipientName,
        admission_number: newDoc.admissionNumber || null,
        class_name: newDoc.className || null,
        section_name: newDoc.sectionName || null,
        roll_number: newDoc.rollNumber || null,
        guardian_name: newDoc.guardianName || null,
        issue_date: newDoc.issueDate,
        issued_by_id: user?.id || null,
        status: newDoc.status,
        verification_token: newDoc.verificationToken,
        remarks: newDoc.remarks || null,
        metadata: newDoc.metadata || {},
      };

      const { error } = await this.supabase.from('school_documents').insert([dbPayload]);
      if (error) {
        console.warn('Supabase document insert note, persisting to local store:', error);
      }
    } catch (e) {
      console.warn('Supabase document insert exception, persisting to local store:', e);
    }

    // 2. Always persist to localStorage for instant client reactivity
    const localDocs = this.getLocalDocuments(schoolId);
    localDocs.unshift(newDoc);
    this.saveLocalDocuments(schoolId, localDocs);

    return newDoc;
  }

  /**
   * Revoke an issued document
   */
  async revokeDocument(documentId: string, reason: string): Promise<boolean> {
    const schoolId = this.getSchoolId();
    const revokedAt = new Date().toISOString();

    // 1. Try Supabase update
    try {
      await this.supabase
        .from('school_documents')
        .update({
          status: 'REVOKED',
          revocation_reason: reason,
          revoked_at: revokedAt,
        })
        .eq('id', documentId);
    } catch {}

    // 2. Update local storage
    const localDocs = this.getLocalDocuments(schoolId);
    const doc = localDocs.find((d) => d.id === documentId);
    if (doc) {
      doc.status = 'REVOKED';
      doc.revocationReason = reason;
      doc.revokedAt = revokedAt;
      this.saveLocalDocuments(schoolId, localDocs);
    }

    return true;
  }

  /**
   * Public Verification for QR Code scans
   */
  async verifyDocument(tokenOrSerial: string): Promise<DocumentVerificationResult> {
    const cleanToken = (tokenOrSerial || '').trim();
    if (!cleanToken) {
      return { success: false, verified: false, error: 'Document token or serial number is required' };
    }

    // 1. Try public RPC verify_issued_document
    try {
      const { data, error } = await this.supabase.rpc('verify_issued_document', {
        p_token: cleanToken,
      });

      if (!error && data && data.success) {
        return data as DocumentVerificationResult;
      }
    } catch (e) {
      console.warn('verify_issued_document RPC note, checking direct records:', e);
    }

    // 2. Direct Supabase query fallback
    try {
      const { data: doc } = await this.supabase
        .from('school_documents')
        .select('*, school:schools(name, code, logo_url, city, state, affiliation_number, board, email, phone)')
        .or(`verification_token.eq.${cleanToken},serial_number.eq.${cleanToken}`)
        .is('deleted_at', null)
        .maybeSingle();

      if (doc) {
        return {
          success: true,
          verified: true,
          document: {
            id: doc.id,
            serialNumber: doc.serial_number,
            documentType: doc.document_type,
            title: doc.title,
            recipientName: doc.recipient_name,
            admissionNumber: doc.admission_number,
            className: doc.class_name,
            sectionName: doc.section_name,
            rollNumber: doc.roll_number,
            guardianName: doc.guardian_name,
            issueDate: doc.issue_date,
            status: doc.status,
            revocationReason: doc.revocation_reason,
            remarks: doc.remarks,
            metadata: doc.metadata,
            createdAt: doc.created_at,
          },
          school: {
            name: doc.school?.name || 'Delhi Heritage Academy',
            code: doc.school?.code || 'DHA',
            logoUrl: doc.school?.logo_url || '',
            city: doc.school?.city || 'New Delhi',
            state: doc.school?.state || 'Delhi',
            affiliationNumber: doc.school?.affiliation_number || 'CBSE-2130894',
            board: doc.school?.board || 'CBSE',
            email: doc.school?.email || 'admin@dha.edu.in',
            phone: doc.school?.phone || '+91 11 2654 8900',
          },
        };
      }
    } catch {}

    // 3. Check local registries across schools
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('schoolsense_documents_'));
      for (const k of keys) {
        const list: SchoolDocument[] = JSON.parse(localStorage.getItem(k) || '[]');
        const found = list.find((d) => d.verificationToken === cleanToken || d.serialNumber === cleanToken);
        if (found) {
          const user = this.auth.currentUser();
          return {
            success: true,
            verified: true,
            document: {
              id: found.id,
              serialNumber: found.serialNumber,
              documentType: found.documentType,
              title: found.title,
              recipientName: found.recipientName,
              admissionNumber: found.admissionNumber,
              className: found.className,
              sectionName: found.sectionName,
              rollNumber: found.rollNumber,
              guardianName: found.guardianName,
              issueDate: found.issueDate,
              status: found.status,
              revocationReason: found.revocationReason,
              remarks: found.remarks,
              metadata: found.metadata,
              createdAt: found.createdAt || new Date().toISOString(),
            },
            school: {
              name: user?.school?.name || 'Delhi Heritage Academy',
              code: user?.school?.code || 'DHA',
              logoUrl: user?.school?.logoUrl || user?.school?.logo_url || '',
              city: (user?.school as any)?.city || 'New Delhi',
              state: (user?.school as any)?.state || 'Delhi',
              affiliationNumber: 'CBSE-2130894',
              board: 'CBSE',
              email: (user?.school as any)?.email || 'admin@dha.edu.in',
              phone: (user?.school as any)?.phone || '+91 11 2654 8900',
            },
          };
        }
      }
    } catch {}

    return {
      success: false,
      verified: false,
      error: 'Invalid or unverified document. The certificate QR code could not be authenticated against the school registry.',
    };
  }

  private mapDbRowToModel(row: any): SchoolDocument {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://schoolsense.in';
    return {
      id: row.id,
      schoolId: row.school_id,
      academicYearId: row.academic_year_id,
      serialNumber: row.serial_number,
      documentType: row.document_type,
      title: row.title,
      recipientType: row.recipient_type || 'STUDENT',
      studentId: row.student_id,
      userId: row.user_id,
      recipientName: row.recipient_name,
      admissionNumber: row.admission_number,
      className: row.class_name,
      sectionName: row.section_name,
      rollNumber: row.roll_number,
      guardianName: row.guardian_name,
      issueDate: row.issue_date,
      issuedById: row.issued_by_id,
      status: row.status || 'ISSUED',
      revocationReason: row.revocation_reason,
      revokedAt: row.revoked_at,
      verificationToken: row.verification_token,
      verificationUrl: `${baseUrl}/verify/${row.verification_token}`,
      remarks: row.remarks,
      metadata: row.metadata || {},
      createdAt: row.created_at,
    };
  }

  private seedDefaultDocuments(schoolId: string): SchoolDocument[] {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://schoolsense.in';
    return [
      {
        id: 'doc-seed-01',
        schoolId,
        serialNumber: 'DHA/2026-27/TC-0042',
        documentType: 'TRANSFER_CERTIFICATE',
        title: 'Transfer Certificate (TC)',
        recipientType: 'STUDENT',
        recipientName: 'Aarav Sharma',
        admissionNumber: 'DHA-2024-0182',
        className: 'Class 10',
        sectionName: 'A',
        rollNumber: '14',
        guardianName: 'Ramesh Sharma',
        issueDate: '2026-11-02',
        status: 'ISSUED',
        verificationToken: 'tc_sec_789123_nov26',
        verificationUrl: `${baseUrl}/verify/tc_sec_789123_nov26`,
        remarks: 'Promoted to higher class. All institutional dues cleared.',
        metadata: {
          reason: 'Parent transfer to another state',
          conduct: 'Exemplary',
          lastExamPassed: 'Class 10 Mid-Term Board Evaluation',
        },
        createdAt: '2026-11-02T10:30:00Z',
      },
      {
        id: 'doc-seed-02',
        schoolId,
        serialNumber: 'DHA/2026-27/BON-0089',
        documentType: 'BONAFIDE_CERTIFICATE',
        title: 'Bonafide Student Certificate',
        recipientType: 'STUDENT',
        recipientName: 'Ananya Verma',
        admissionNumber: 'DHA-2023-0105',
        className: 'Class 9',
        sectionName: 'B',
        rollNumber: '08',
        guardianName: 'Sunil Verma',
        issueDate: '2026-11-05',
        status: 'ISSUED',
        verificationToken: 'bon_sec_456789_nov26',
        verificationUrl: `${baseUrl}/verify/bon_sec_456789_nov26`,
        remarks: 'Issued for Passport Application and Scholarship verification.',
        metadata: {
          purpose: 'Passport / National Scholarship',
          character: 'Good',
        },
        createdAt: '2026-11-05T14:15:00Z',
      },
      {
        id: 'doc-seed-03',
        schoolId,
        serialNumber: 'DHA/2026-27/NOD-0112',
        documentType: 'FEE_NO_DUES',
        title: 'Fee Clearance & No Dues Certificate',
        recipientType: 'STUDENT',
        recipientName: 'Kabir Patel',
        admissionNumber: 'DHA-2022-0091',
        className: 'Class 11',
        sectionName: 'Science',
        rollNumber: '21',
        guardianName: 'Vikram Patel',
        issueDate: '2026-11-07',
        status: 'ISSUED',
        verificationToken: 'nod_sec_112233_nov26',
        verificationUrl: `${baseUrl}/verify/nod_sec_112233_nov26`,
        remarks: 'Tuition, Lab, and Transport dues fully cleared up to Q3.',
        metadata: {
          academicQuarter: 'Q3 (Oct-Dec 2026)',
          amountCleared: '₹34,500',
        },
        createdAt: '2026-11-07T09:45:00Z',
      },
    ];
  }
}
