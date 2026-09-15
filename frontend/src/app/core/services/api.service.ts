import { Injectable, inject } from '@angular/core';
import { Observable, from, of, map, catchError } from 'rxjs';
import { SupabaseService } from './supabase.service';
import {
  DashboardStats,
  ClassItem,
  SubjectItem,
  StudentItem,
  AttendanceRegisterResponse,
  HomeworkItem,
  Exam,
  Notice,
  SchoolEventItem,
  ComplaintItem,
  AcademicSession,
  AlumniStudent,
} from '../models';

export function getClassPedagogicalRank(name: string, code?: string, displayOrder?: number): number {
  const norm = (name || '').toLowerCase().trim();
  const codeNorm = (code || '').toLowerCase().trim();

  // Pre-Nursery / Playgroup
  if (norm.includes('pre-nur') || norm.includes('pre nur') || norm.includes('prenur') || norm.includes('play') || codeNorm.includes('pre_nur') || codeNorm.includes('prenur')) return 1;
  // Nursery
  if (norm === 'nursery' || norm.includes('nur') || codeNorm === 'nur') return 2;
  // LKG / KG-1 / KG1 / Junior KG
  if (norm.includes('lkg') || norm.includes('kg-1') || norm.includes('kg 1') || norm.includes('kg1') || norm.includes('jr') || codeNorm.includes('lkg')) return 3;
  // UKG / KG-2 / KG2 / Senior KG
  if (norm.includes('ukg') || norm.includes('kg-2') || norm.includes('kg 2') || norm.includes('kg2') || norm.includes('sr') || codeNorm.includes('ukg')) return 4;

  // Numeric Class matching: e.g. "Class 1", "Class 2", "Grade 10", "1", "2", "CLS-1", etc.
  const numMatch = norm.match(/\d+/);
  if (numMatch) {
    return 4 + parseInt(numMatch[0], 10);
  }

  // Fallback to display_order if valid
  if (typeof displayOrder === 'number' && displayOrder > 0) {
    return 100 + displayOrder;
  }

  return 999;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private supabase = inject(SupabaseService);

  private getSchoolId(): string {
    const raw = localStorage.getItem('schoolsense_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        return u?.school?.id || '';
      } catch {}
    }
    return '';
  }

  private getUserId(): string {
    const u = this.getCurrentUser();
    return u?.id || '';
  }

  private getCurrentUser(): any {
    const raw = localStorage.getItem('schoolsense_user');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return null;
  }

  private isParentUser(): boolean {
    const u = this.getCurrentUser();
    return u?.role === 'GUARDIAN' || u?.role === 'PARENT';
  }

  get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    const cleanEndpoint = endpoint.split('?')[0];

    // Dashboard Overview
    if (cleanEndpoint === 'dashboard/overview' || cleanEndpoint === 'dashboard') {
      return from(this.getDashboardOverview(params?.['academicYearId'])) as unknown as Observable<T>;
    }

    // SaaS Subscription & Wallet Overview
    if (cleanEndpoint === 'subscription/overview' || cleanEndpoint === 'subscription') {
      const targetSchoolId = params?.['schoolId'] || this.getSchoolId();
      return from(this.getSubscriptionDetails(targetSchoolId, params?.['academicYearId'])) as unknown as Observable<T>;
    }

    // SaaS Monthly Calculation & Proration Roster
    if (cleanEndpoint === 'subscription/calculate') {
      const targetSchoolId = params?.['schoolId'] || this.getSchoolId();
      return from(this.calculateMonthlySubscription(targetSchoolId, params?.['academicYearId'])) as unknown as Observable<T>;
    }

    // Academics: Classes
    if (cleanEndpoint === 'academics/classes') {
      return from(this.getClasses(params?.['academicYearId'])) as unknown as Observable<T>;
    }

    // Academics: Academic Sessions
    if (cleanEndpoint === 'academics/sessions' || cleanEndpoint === 'academic-years') {
      return from(this.getAcademicSessions()) as unknown as Observable<T>;
    }

    // Academics: Alumni
    if (cleanEndpoint === 'academics/alumni') {
      return from(this.getAlumniStudents()) as unknown as Observable<T>;
    }

    // Academics: Subjects
    if (cleanEndpoint === 'academics/subjects' || cleanEndpoint.match(/^academics\/classes\/.*\/subjects$/)) {
      return from(this.getSubjects()) as unknown as Observable<T>;
    }

    // Academics: Staff
    if (cleanEndpoint === 'academics/staff' || cleanEndpoint === 'complaints/faculty') {
      return from(this.getStaff()) as unknown as Observable<T>;
    }

    // Academics: Student Deactivation Requests
    if (cleanEndpoint === 'academics/students/deactivation-requests' || cleanEndpoint === 'students/deactivation-requests') {
      return from(this.getStudentDeactivationRequests()) as unknown as Observable<T>;
    }

    // Academics: Section Students
    const sectionStudentsMatch = cleanEndpoint.match(/^academics\/sections\/(.+)\/students$/);
    if (sectionStudentsMatch) {
      return from(this.getSectionStudents(sectionStudentsMatch[1], params?.['academicYearId'])) as unknown as Observable<T>;
    }

    // Academics: Sections
    if (cleanEndpoint === 'academics/sections') {
      return from(this.getSections()) as unknown as Observable<T>;
    }

    // Attendance
    const attendanceSectionMatch = cleanEndpoint.match(/^attendance\/section\/(.+)$/);
    if (attendanceSectionMatch) {
      const date = params?.['date'] || new Date().toISOString().split('T')[0];
      return from(this.getAttendance(attendanceSectionMatch[1], date)) as unknown as Observable<T>;
    }

    // Homework
    const homeworkSectionMatch = cleanEndpoint.match(/^homework\/section\/(.+)$/);
    if (homeworkSectionMatch) {
      return from(this.getHomework(homeworkSectionMatch[1])) as unknown as Observable<T>;
    }

    // Exams
    if (cleanEndpoint === 'exams') {
      return from(this.getExams()) as unknown as Observable<T>;
    }

    // Communication: Notices
    if (cleanEndpoint === 'communication/notices') {
      return from(this.getNotices()) as unknown as Observable<T>;
    }

    // Communication: Events
    if (cleanEndpoint === 'communication/events') {
      return from(this.getEvents()) as unknown as Observable<T>;
    }

    // Complaints
    if (cleanEndpoint === 'complaints') {
      return from(this.getComplaints(params)) as unknown as Observable<T>;
    }

    if (cleanEndpoint === 'complaints/my-children') {
      return from(this.getMyChildren()) as unknown as Observable<T>;
    }

    // Parent Attendance
    if (cleanEndpoint === 'attendance/my-children' || cleanEndpoint.startsWith('attendance/my-children')) {
      return from(this.getMyChildrenAttendance(params?.['studentId'], params?.['academicYearId'])) as unknown as Observable<T>;
    }

    // Parent Timetable
    if (cleanEndpoint === 'timetable/my-child' || cleanEndpoint.startsWith('timetable/my-child')) {
      return from(this.getMyChildTimetable(params?.['studentId'])) as unknown as Observable<T>;
    }

    // Timetable
    if (cleanEndpoint.startsWith('timetable/section/')) {
      const sectionId = cleanEndpoint.replace('timetable/section/', '');
      return from(this.getTimetable(sectionId)) as unknown as Observable<T>;
    }

    if (cleanEndpoint === 'timetable/teacher') {
      return from(this.getTeacherTimetable(params?.['teacherId'])) as unknown as Observable<T>;
    }

    // Default fallback
    return of([] as unknown as T);
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    const cleanEndpoint = endpoint.split('?')[0];

    // Academic Sessions & Rollover
    if (cleanEndpoint === 'academics/sessions' || cleanEndpoint === 'academic-years') {
      return from(this.createAcademicSession(body)) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'academics/sessions/rollover' || cleanEndpoint === 'academic-years/rollover') {
      return from(this.rolloverStudents(body)) as unknown as Observable<T>;
    }

    // Create Subject
    if (cleanEndpoint === 'academics/subjects') {
      return from(this.createSubject(body)) as unknown as Observable<T>;
    }

    // Create Class / Section / Seed Standard
    if (cleanEndpoint === 'academics/classes/seed-standard' || cleanEndpoint === 'academics/classes/seed') {
      return from(this.seedStandardClasses()) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'academics/classes') {
      return from(this.createClass(body)) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'academics/sections') {
      return from(this.createSection(body)) as unknown as Observable<T>;
    }

    // Attendance Bulk
    if (cleanEndpoint === 'attendance/bulk') {
      return from(this.saveAttendanceBulk(body)) as unknown as Observable<T>;
    }

    // Homework
    if (cleanEndpoint === 'homework') {
      return from(this.createHomework(body)) as unknown as Observable<T>;
    }

    // Exams
    if (cleanEndpoint === 'exams') {
      return from(this.createExam(body)) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'exams/marks/bulk') {
      return from(this.saveMarksBulk(body)) as unknown as Observable<T>;
    }

    // Communication
    if (cleanEndpoint === 'communication/notices') {
      return from(this.createNotice(body)) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'communication/events') {
      return from(this.createEvent(body)) as unknown as Observable<T>;
    }

    // Complaints
    if (cleanEndpoint === 'complaints') {
      return from(this.createComplaint(body)) as unknown as Observable<T>;
    }

    // Create Staff / Faculty / Principal
    if (cleanEndpoint === 'academics/staff' || cleanEndpoint === 'staff') {
      return from(this.createStaff(body)) as unknown as Observable<T>;
    }

    // Create Student
    if (cleanEndpoint === 'academics/students') {
      return from(this.createStudent(body)) as unknown as Observable<T>;
    }

    // Student Deactivation Request
    if (cleanEndpoint === 'academics/students/deactivation-requests' || cleanEndpoint === 'students/deactivation-requests') {
      return from(this.submitStudentDeactivationRequest(body)) as unknown as Observable<T>;
    }

    // SaaS Subscription & Wallet Actions
    if (cleanEndpoint === 'subscription/wallet/top-up' || cleanEndpoint === 'wallet/top-up') {
      return from(this.topUpWallet(body)) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'subscription/billing/run' || cleanEndpoint === 'subscription/bill') {
      return from(this.executeMonthlyBilling(body)) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'subscription/rate/update' || cleanEndpoint === 'subscription/rate') {
      return from(this.updateSubscriptionRate(body)) as unknown as Observable<T>;
    }

    if (cleanEndpoint.startsWith('complaints/') && cleanEndpoint.endsWith('/status')) {
      const ticketId = cleanEndpoint.split('/')[1];
      return from(this.updateComplaintStatus(ticketId, body.status)) as unknown as Observable<T>;
    }

    return of({ success: true, ...body } as unknown as T);
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    const cleanEndpoint = endpoint.split('?')[0];

    if (cleanEndpoint.startsWith('academics/classes/')) {
      const id = cleanEndpoint.replace('academics/classes/', '');
      return from(this.updateClass(id, body)) as unknown as Observable<T>;
    }

    if (cleanEndpoint.startsWith('academics/sections/')) {
      const id = cleanEndpoint.replace('academics/sections/', '');
      return from(this.updateSection(id, body)) as unknown as Observable<T>;
    }

    // Staff Status Update (Admin / Principal)
    const staffStatusMatch = cleanEndpoint.match(/^academics\/staff\/(.+)\/status$/);
    if (staffStatusMatch) {
      return from(this.updateStaffStatus(staffStatusMatch[1], body.status)) as unknown as Observable<T>;
    }

    // Student Status Update (Admin / Principal)
    const studentStatusMatch = cleanEndpoint.match(/^academics\/students\/(.+)\/status$/);
    if (studentStatusMatch) {
      return from(this.updateStudentStatus(studentStatusMatch[1], body.status, body.reason)) as unknown as Observable<T>;
    }

    // Review Student Deactivation Request (Admin / Principal)
    const deactReviewMatch = cleanEndpoint.match(/^academics\/students\/deactivation-requests\/(.+)\/review$/);
    if (deactReviewMatch) {
      return from(this.reviewStudentDeactivationRequest(deactReviewMatch[1], body.action, body.reviewNotes)) as unknown as Observable<T>;
    }

    if (cleanEndpoint.startsWith('complaints/') && cleanEndpoint.endsWith('/status')) {
      const ticketId = cleanEndpoint.split('/')[1];
      return from(this.updateComplaintStatus(ticketId, body.status)) as unknown as Observable<T>;
    }

    return of({ success: true, ...body } as unknown as T);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    const cleanEndpoint = endpoint.split('?')[0];

    if (cleanEndpoint.startsWith('academics/classes/')) {
      const id = cleanEndpoint.replace('academics/classes/', '');
      return from(this.updateClass(id, body)) as unknown as Observable<T>;
    }

    if (cleanEndpoint.startsWith('academics/sections/')) {
      const id = cleanEndpoint.replace('academics/sections/', '');
      return from(this.updateSection(id, body)) as unknown as Observable<T>;
    }

    return this.patch<T>(endpoint, body);
  }

  delete<T>(endpoint: string): Observable<T> {
    const cleanEndpoint = endpoint.split('?')[0];

    if (cleanEndpoint.startsWith('academics/classes/')) {
      const id = cleanEndpoint.replace('academics/classes/', '');
      return from(this.deleteClass(id)) as unknown as Observable<T>;
    }

    if (cleanEndpoint.startsWith('academics/sections/')) {
      const id = cleanEndpoint.replace('academics/sections/', '');
      return from(this.deleteSection(id)) as unknown as Observable<T>;
    }

    if (cleanEndpoint.startsWith('academics/sessions/') || cleanEndpoint.startsWith('academic-years/')) {
      const id = cleanEndpoint.replace('academics/sessions/', '').replace('academic-years/', '');
      return from(this.deleteAcademicSession(id)) as unknown as Observable<T>;
    }

    if (cleanEndpoint.startsWith('academics/subjects/')) {
      const id = cleanEndpoint.replace('academics/subjects/', '');
      return from(this.deleteSubject(id)) as unknown as Observable<T>;
    }

    if (cleanEndpoint.startsWith('timetable/periods/')) {
      const id = cleanEndpoint.replace('timetable/periods/', '');
      return from(this.deleteTimetablePeriod(id)) as unknown as Observable<T>;
    }

    return of({ success: true } as unknown as T);
  }

  private async updateClass(id: string, body: any) {
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.code !== undefined) updates.code = body.code.trim().toUpperCase();
    if (body.display_order !== undefined) updates.display_order = Number(body.display_order);

    const { data, error } = await this.supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        throw new Error(`A class named "${body.name || ''}" (code: ${body.code || ''}) already exists in your school.`);
      }
      throw error;
    }
    return data;
  }

  private async updateSection(id: string, body: any) {
    const updates: any = {};
    if (body.name !== undefined) {
      let secName = body.name.trim();
      if (/^[A-Z]$/i.test(secName)) secName = `Section ${secName.toUpperCase()}`;
      updates.name = secName;
    }
    if (body.code !== undefined) updates.code = body.code.trim().toUpperCase();
    if (body.capacity !== undefined) updates.capacity = Number(body.capacity);
    if (body.display_order !== undefined) updates.display_order = Number(body.display_order);
    if (body.class_teacher_id !== undefined) updates.class_teacher_id = body.class_teacher_id || null;

    const { data, error } = await this.supabase
      .from('sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        throw new Error(`A section with this name or code already exists for this class.`);
      }
      throw error;
    }
    return data;
  }

  private async deleteClass(id: string) {
    const { error } = await this.supabase.from('classes').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  }

  private async deleteSection(id: string) {
    const { error } = await this.supabase.from('sections').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  }

  // ============================================================================
  // Supabase Implementation Handlers
  // ============================================================================

  private async getDashboardOverview(academicYearId?: string): Promise<DashboardStats> {
    const schoolId = this.getSchoolId();
    const effectiveYearId = academicYearId || (await this.getActiveAcademicYearId(schoolId));

    let studentCount = 0;
    let classCount = 0;
    let teacherCount = 0;
    let complaintsCount = 0;

    if (schoolId) {
      let enrQuery = this.supabase
        .from('student_enrollments')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'INACTIVE');
      if (effectiveYearId) {
        enrQuery = enrQuery.eq('academic_year_id', effectiveYearId);
      }

      const [cRes, tRes, compRes, enrRes] = await Promise.all([
        this.supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', schoolId) as any,
        this.supabase.from('user_school_roles').select('id', { count: 'exact', head: true }).eq('school_id', schoolId) as any,
        this.supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'OPEN') as any,
        enrQuery as any,
      ]);

      classCount = cRes.count || 0;
      teacherCount = tRes.count || 0;
      complaintsCount = compRes.count || 0;
      studentCount = enrRes.count || 0;

      // Fallback: If 0 enrollments in DB for base session, check local map & active students
      if (studentCount === 0 && effectiveYearId) {
        try {
          const { data: activeYears } = await this.supabase
            .from('academic_years')
            .select('id, is_current')
            .eq('school_id', schoolId)
            .eq('is_current', true);
          const isBase = activeYears && activeYears.length > 0 && activeYears[0].id === effectiveYearId;
          if (isBase) {
            const { count: stCount } = await this.supabase
              .from('students')
              .select('id', { count: 'exact', head: true })
              .eq('school_id', schoolId)
              .neq('status', 'INACTIVE');
            studentCount = stCount || 0;
          }
        } catch {}
      }
    }

    const { data: notices } = await this.supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: exams } = await this.supabase
      .from('exams')
      .select('*')
      .order('start_date', { ascending: true })
      .limit(5);

    const overview: DashboardStats = {
      stats: {
        totalStudents: studentCount,
        totalClasses: classCount,
        totalTeachers: teacherCount,
        attendanceTodayPercentage: '0.0',
        attendanceMarkedCount: 0,
        pendingComplaints: complaintsCount,
      },
      recentNotices: (notices || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        target_audience: n.target_audience?.[0] || 'ALL',
        published_at: n.publish_date || n.created_at,
      })),
      upcomingExams: (exams || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        code: e.code,
        start_date: e.start_date,
        end_date: e.end_date,
        status: e.status,
      })),
    };

    if (this.isParentUser()) {
      const myChildren = await this.getMyChildren();
      (overview as any).parentData = {
        children: myChildren,
        activeChild: myChildren[0] || null,
      };
    }

    return overview;
  }

  private ensuringEnrollmentsPromise: Promise<void> | null = null;

  public async ensureSessionEnrollments(schoolId?: string, targetYearId?: string): Promise<void> {
    const sId = schoolId || this.getSchoolId();
    if (!sId) return;

    if (this.ensuringEnrollmentsPromise) {
      return this.ensuringEnrollmentsPromise;
    }

    this.ensuringEnrollmentsPromise = (async () => {
      try {
        const yearId = targetYearId || (await this.getActiveAcademicYearId(sId));
        if (!yearId) return;

        // Check if enrollments already exist for this academic year
        const { count, error } = await this.supabase
          .from('student_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('academic_year_id', yearId);

        if (!error && typeof count === 'number' && count > 0) {
          return;
        }

        // Check total enrollments across all sessions in this school
        const { count: totalEnrCount } = await this.supabase
          .from('student_enrollments')
          .select('id', { count: 'exact', head: true });

        const { data: activeYears } = await this.supabase
          .from('academic_years')
          .select('id, is_current')
          .eq('school_id', sId)
          .eq('is_current', true);
        const isCurrentActive = activeYears && activeYears.length > 0 && activeYears[0].id === yearId;

        // Only auto-provision for the base active session or when 0 total enrollments exist in the database
        if (totalEnrCount && totalEnrCount > 0 && !isCurrentActive) {
          return;
        }

        // Fetch active students in school
        const { data: students } = await this.supabase
          .from('students')
          .select('id, admission_number, first_name, last_name, gender, status')
          .eq('school_id', sId)
          .neq('status', 'INACTIVE');

        if (!students || students.length === 0) return;

        // Fetch classes and sections
        const { data: classes } = await this.supabase
          .from('classes')
          .select('id, name, code, display_order, sections(id, name, code, display_order)')
          .eq('school_id', sId)
          .order('display_order');

        if (!classes || classes.length === 0) return;

        const sortedClasses = (classes || []).sort(
          (a: any, b: any) => getClassPedagogicalRank(a.name, a.code, a.display_order) - getClassPedagogicalRank(b.name, b.code, b.display_order)
        );

        // Gather all sections in pedagogical order
        const allSections: { id: string; name: string; classId: string; className: string }[] = [];
        for (const cls of sortedClasses) {
          const sortedSecs = (cls.sections || []).sort(
            (a: any, b: any) => (a.name || '').localeCompare(b.name || '')
          );
          for (const sec of sortedSecs) {
            allSections.push({
              id: sec.id,
              name: sec.name,
              classId: cls.id,
              className: cls.name,
            });
          }
        }

        if (allSections.length === 0) return;

        const localMap = this.getStudentSectionMap();
        const validSectionIds = new Set(allSections.map((s) => s.id));

        const enrollmentsToInsert: any[] = [];
        const updatedLocalMap: Record<string, any> = { ...localMap };

        for (let i = 0; i < students.length; i++) {
          const st = students[i];
          const existing = localMap[st.id];

          let targetSec: { id: string; name: string; classId: string; className: string };
          let rollNo: string;

          if (existing?.sectionId && validSectionIds.has(existing.sectionId)) {
            targetSec = allSections.find((s) => s.id === existing.sectionId)!;
            rollNo = String(existing.rollNumber || (i % 7) + 1);
          } else {
            const secIndex = i % allSections.length;
            targetSec = allSections[secIndex];
            rollNo = String(Math.floor(i / allSections.length) + 1);
          }

          enrollmentsToInsert.push({
            student_id: st.id,
            section_id: targetSec.id,
            academic_year_id: yearId,
            roll_number: rollNo,
            status: 'ACTIVE',
          });

          updatedLocalMap[st.id] = {
            classId: targetSec.classId,
            className: targetSec.className,
            sectionId: targetSec.id,
            sectionName: targetSec.name,
            rollNumber: rollNo,
          };
        }

        const CHUNK_SIZE = 50;
        for (let i = 0; i < enrollmentsToInsert.length; i += CHUNK_SIZE) {
          const chunk = enrollmentsToInsert.slice(i, i + CHUNK_SIZE);
          await this.supabase.from('student_enrollments').insert(chunk);
        }

        try {
          localStorage.setItem('schoolsense_student_sections', JSON.stringify(updatedLocalMap));
        } catch {}
      } catch (err) {
        console.warn('ensureSessionEnrollments warning:', err);
      } finally {
        this.ensuringEnrollmentsPromise = null;
      }
    })();

    return this.ensuringEnrollmentsPromise;
  }

  private async getClasses(academicYearId?: string): Promise<ClassItem[]> {
    const schoolId = this.getSchoolId();
    const effectiveYearId = academicYearId || (await this.getActiveAcademicYearId(schoolId));

    if (effectiveYearId) {
      await this.ensureSessionEnrollments(schoolId, effectiveYearId);
    }

    let query = this.supabase.from('classes').select('*').order('display_order');
    if (schoolId) query = query.eq('school_id', schoolId);
    const { data: classesData, error } = await query;
    if (error) throw error;

    // Fetch sections strictly for this academic session (or null academic_year_id)
    let secQuery = this.supabase.from('sections').select('*').order('display_order');
    if (schoolId) secQuery = secQuery.eq('school_id', schoolId);
    if (effectiveYearId) {
      secQuery = secQuery.or(`academic_year_id.eq.${effectiveYearId},academic_year_id.is.null`);
    }
    const { data: rawSections } = await secQuery;
    let sectionsData = rawSections || [];

    // If classes exist but 0 sections exist for this specific session, auto-provision Section A for each class
    if (effectiveYearId && classesData && classesData.length > 0) {
      const yearSections = sectionsData.filter((s: any) => s.academic_year_id === effectiveYearId);
      if (yearSections.length === 0) {
        const sectionsToCreate: any[] = [];
        for (const cls of classesData) {
          sectionsToCreate.push({
            school_id: schoolId,
            class_id: cls.id,
            academic_year_id: effectiveYearId,
            name: 'Section A',
            code: 'A',
            capacity: 40,
            display_order: 1,
            status: 'ACTIVE',
          });
        }
        try {
          const { data: createdSecs } = await this.supabase.from('sections').insert(sectionsToCreate).select('*');
          if (createdSecs && createdSecs.length > 0) {
            sectionsData = createdSecs;
          }
        } catch (e) {
          console.warn('Auto-provision sections note:', e);
        }
      } else {
        sectionsData = yearSections;
      }
    }

    // Group sections by class_id
    const classSectionsMap = new Map<string, any[]>();
    sectionsData.forEach((sec: any) => {
      if (!classSectionsMap.has(sec.class_id)) classSectionsMap.set(sec.class_id, []);
      classSectionsMap.get(sec.class_id)!.push(sec);
    });

    let sectionEnrollmentCounts: Record<string, number> = {};
    try {
      let enrollQuery = this.supabase.from('student_enrollments').select('section_id, status');
      if (effectiveYearId) {
        enrollQuery = enrollQuery.eq('academic_year_id', effectiveYearId);
      }
      const { data: enrollData } = await enrollQuery;
      (enrollData || []).forEach((e: any) => {
        if (e.section_id && e.status !== 'INACTIVE') {
          sectionEnrollmentCounts[e.section_id] = (sectionEnrollmentCounts[e.section_id] || 0) + 1;
        }
      });
    } catch (err) {
      console.warn('Enrollment counts query warning:', err);
    }

    // Fallback: If no enrollments exist in DB for base session yet, derive from local map
    if (Object.keys(sectionEnrollmentCounts).length === 0) {
      try {
        const { data: activeYears } = await this.supabase
          .from('academic_years')
          .select('id, is_current')
          .eq('school_id', schoolId)
          .eq('is_current', true);
        const isBaseSession = !effectiveYearId || (activeYears && activeYears.length > 0 && activeYears[0].id === effectiveYearId);
        if (isBaseSession) {
          const localMap = this.getStudentSectionMap();
          Object.values(localMap).forEach((info) => {
            if (info.sectionId) {
              sectionEnrollmentCounts[info.sectionId] = (sectionEnrollmentCounts[info.sectionId] || 0) + 1;
            }
          });
        }
      } catch {}
    }

    // Attach assigned subjects to classes and sections
    let allSubjects: SubjectItem[] = [];
    try {
      allSubjects = await this.getSubjects();
    } catch {}

    const classSubjectMap = new Map<string, SubjectItem[]>();
    const sectionSubjectMap = new Map<string, SubjectItem[]>();

    allSubjects.forEach((sub) => {
      if (sub.class_id) {
        if (!classSubjectMap.has(sub.class_id)) classSubjectMap.set(sub.class_id, []);
        classSubjectMap.get(sub.class_id)!.push(sub);
      }
      if (sub.section_ids && sub.section_ids.length > 0) {
        sub.section_ids.forEach((secId) => {
          if (!sectionSubjectMap.has(secId)) sectionSubjectMap.set(secId, []);
          sectionSubjectMap.get(secId)!.push(sub);
        });
      }
    });

    const mapped = (classesData || []).map((c: any) => {
      const clsSubjects = classSubjectMap.get(c.id) || [];
      const clsSections = classSectionsMap.get(c.id) || [];
      return {
        id: c.id,
        name: c.name,
        code: c.code,
        display_order: c.display_order,
        subjects: clsSubjects,
        sections: clsSections.map((s: any) => {
          const directSecSubs = sectionSubjectMap.get(s.id) || [];
          const inheritedAllSecSubs = clsSubjects.filter((sub) => sub.is_all_sections && !directSecSubs.some((ds) => ds.id === sub.id));
          return {
            id: s.id,
            class_id: s.class_id,
            academic_year_id: s.academic_year_id,
            name: s.name,
            code: s.code,
            capacity: s.capacity || 40,
            enrolled_count: sectionEnrollmentCounts[s.id] || 0,
            display_order: s.display_order || 0,
            class_teacher_id: s.class_teacher_id || null,
            subjects: [...directSecSubs, ...inheritedAllSecSubs],
          };
        }),
      };
    });

    return mapped.sort(
      (a, b) => getClassPedagogicalRank(a.name, a.code, a.display_order) - getClassPedagogicalRank(b.name, b.code, b.display_order)
    );
  }

  public getSectionSubjectMap(): Record<string, any> {
    try {
      const raw = localStorage.getItem('schoolsense_section_subjects');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private async getSubjects(): Promise<SubjectItem[]> {
    const schoolId = this.getSchoolId();
    let query = this.supabase.from('subjects').select('*').order('name');
    if (schoolId) query = query.eq('school_id', schoolId);
    const { data, error } = await query;
    if (error) throw error;

    const map = this.getSectionSubjectMap();

    // Fetch classes and sections to resolve section names and class names
    let sectionMap = new Map<string, any>();
    let classMap = new Map<string, string>();
    const stSubjectSections = new Map<string, Set<string>>();

    try {
      const [sectionsRes, classesRes, stRes] = await Promise.all([
        this.supabase.from('sections').select('id, name, class_id').eq('school_id', schoolId),
        this.supabase.from('classes').select('id, name').eq('school_id', schoolId),
        this.supabase.from('subject_teachers').select('subject_id, section_id'),
      ]);

      sectionMap = new Map((sectionsRes.data || []).map((s: any) => [s.id, s]));
      classMap = new Map((classesRes.data || []).map((c: any) => [c.id, c.name]));

      (stRes.data || []).forEach((st: any) => {
        if (st.subject_id && st.section_id) {
          if (!stSubjectSections.has(st.subject_id)) {
            stSubjectSections.set(st.subject_id, new Set());
          }
          stSubjectSections.get(st.subject_id)!.add(st.section_id);
        }
      });
    } catch {}

    return (data || []).map((s: any) => {
      const localEntry = map[s.id] || {};
      const stSecs = Array.from(stSubjectSections.get(s.id) || []);
      const effectiveSectionIds: string[] =
        localEntry.section_ids && localEntry.section_ids.length > 0
          ? localEntry.section_ids
          : stSecs;

      const secNames = effectiveSectionIds
        .map((secId) => sectionMap.get(secId)?.name)
        .filter(Boolean) as string[];

      let resolvedClassId = localEntry.class_id || '';
      let resolvedClassName = localEntry.class_name || '';

      if (!resolvedClassId && effectiveSectionIds.length > 0) {
        const firstSec = sectionMap.get(effectiveSectionIds[0]);
        if (firstSec?.class_id) {
          resolvedClassId = firstSec.class_id;
          resolvedClassName = classMap.get(firstSec.class_id) || '';
        }
      }

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        subject_type: s.type || 'THEORY',
        display_order: 0,
        class_id: resolvedClassId,
        class_name: resolvedClassName,
        section_ids: effectiveSectionIds,
        section_names: secNames,
        is_all_sections: localEntry.is_all_sections ?? (effectiveSectionIds.length === 0),
      };
    });
  }

  private async getStaff(): Promise<any[]> {
    const schoolId = this.getSchoolId();
    if (!schoolId) return [];

    try {
      // 1. Fetch user_school_roles, users, roles, sections, subject teachers, and classes
      const [usrRes, usersRes, rolesRes, sectionsRes, subjectTeachersRes, classesRes, subjectsRes] = await Promise.all([
        this.supabase.from('user_school_roles').select('*').eq('school_id', schoolId),
        this.supabase.from('users').select('*'),
        this.supabase.from('roles').select('*'),
        this.supabase.from('sections').select('id, name, class_id, class_teacher_id').eq('school_id', schoolId),
        this.supabase.from('subject_teachers').select('*'),
        this.supabase.from('classes').select('id, name').eq('school_id', schoolId),
        this.supabase.from('subjects').select('id, name, code').eq('school_id', schoolId),
      ]);

      const userMap = new Map((usersRes.data || []).map((u: any) => [u.id, u]));
      const roleMap = new Map((rolesRes.data || []).map((r: any) => [r.id, r]));
      const classMap = new Map((classesRes.data || []).map((c: any) => [c.id, c]));
      const subjectMap = new Map((subjectsRes.data || []).map((s: any) => [s.id, s]));
      const sectionMap = new Map((sectionsRes.data || []).map((s: any) => [s.id, s]));

      const staffList: any[] = [];
      const seenUserIds = new Set<string>();

      // Clean up any stray root admin user_school_roles for this tenant school
      const rootUser = (usersRes.data || []).find(
        (u: any) => u.email?.toLowerCase() === 'admin@schoolscence.in' || u.id === '00000000-0000-0000-0000-000000000001'
      );
      if (rootUser) {
        Promise.resolve(
          this.supabase
            .from('user_school_roles')
            .delete()
            .eq('user_id', rootUser.id)
            .eq('school_id', schoolId)
        ).catch(() => {});
      }

      const usrList = usrRes.data || [];
      for (const usr of usrList) {
        const u = userMap.get(usr.user_id);
        if (!u) continue;
        const r = roleMap.get(usr.role_id);
        const roleCode = (r?.code || 'TEACHER').toUpperCase();

        // Exclude STUDENT, PARENT, and platform SUPER_ADMIN / Root Administrator from school staff directory
        if (roleCode === 'STUDENT' || roleCode === 'PARENT' || roleCode === 'SUPER_ADMIN') continue;
        if (u.email?.toLowerCase() === 'admin@schoolscence.in' || u.id === '00000000-0000-0000-0000-000000000001') continue;

        seenUserIds.add(u.id);

        // Class teacher sections
        const cts = (sectionsRes.data || [])
          .filter((sec: any) => sec.class_teacher_id === u.id)
          .map((sec: any) => ({
            sectionId: sec.id,
            sectionName: sec.name,
            className: classMap.get(sec.class_id)?.name || 'Class',
          }));

        // Subject assignments
        const stAssignments = (subjectTeachersRes.data || [])
          .filter((st: any) => st.teacher_id === u.id)
          .map((st: any) => {
            const sec = sectionMap.get(st.section_id);
            const sub = subjectMap.get(st.subject_id);
            return {
              sectionId: st.section_id,
              sectionName: sec?.name || '',
              className: sec ? (classMap.get(sec.class_id)?.name || '') : '',
              subjectName: sub?.name || 'Subject',
              subjectCode: sub?.code || '',
            };
          });

        staffList.push({
          id: u.id,
          firstName: u.first_name || 'Staff',
          lastName: u.last_name || '',
          fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Staff Member',
          email: u.email,
          phone: u.phone,
          role: roleCode,
          roleName: r?.name || (roleCode === 'SCHOOL_ADMIN' ? 'School Admin' : (roleCode === 'PRINCIPAL' ? 'Principal' : 'Teacher')),
          classTeacherSections: cts,
          subjectAssignments: stAssignments,
          status: usr.status || u.status || 'ACTIVE',
          createdAt: usr.created_at || u.created_at,
        });
      }

      // Self-healing: Find any staff/admin users specifically belonging to this school's domain
      const schoolData = (await this.supabase.from('schools').select('domain, slug, code').eq('id', schoolId).single()).data;
      const schoolDomain = (schoolData?.domain || '').toLowerCase().trim();

      if (schoolDomain) {
        for (const u of (usersRes.data || [])) {
          if (seenUserIds.has(u.id)) continue;
          if (!u.email) continue;
          const uEmail = u.email.toLowerCase();

          // Never attach platform super admin / root user to school staff
          if (uEmail === 'admin@schoolscence.in' || u.id === '00000000-0000-0000-0000-000000000001') continue;

          // Only match if user email belongs to this school's specific domain
          if (uEmail.endsWith('@' + schoolDomain)) {
            const roleCode = uEmail.startsWith('admin@') ? 'SCHOOL_ADMIN' : (uEmail.startsWith('principal@') ? 'PRINCIPAL' : 'TEACHER');
            const defaultRole = (rolesRes.data || []).find((r: any) => r.code === roleCode || r.code === 'TEACHER');
            if (defaultRole) {
              Promise.resolve(
                this.supabase.from('user_school_roles').insert({
                  user_id: u.id,
                  school_id: schoolId,
                  role_id: defaultRole.id,
                  status: 'ACTIVE',
                })
              ).catch(() => {});
            }

            staffList.push({
              id: u.id,
              firstName: u.first_name || 'Staff',
              lastName: u.last_name || '',
              fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Staff Member',
              email: u.email,
              phone: u.phone,
              role: roleCode,
              roleName: roleCode === 'SCHOOL_ADMIN' ? 'School Admin' : (roleCode === 'PRINCIPAL' ? 'Principal' : 'Teacher'),
              classTeacherSections: [],
              subjectAssignments: [],
              status: u.status || 'ACTIVE',
              createdAt: u.created_at,
            });
            seenUserIds.add(u.id);
          }
        }
      }

      return staffList;
    } catch (e) {
      console.error('getStaff error:', e);
      return [];
    }
  }

  private async createStaff(body: any): Promise<any> {
    const schoolId = this.getSchoolId();
    if (!schoolId) {
      throw new Error('No active school context found.');
    }

    const cleanFirstName = (body.firstName || '').trim();
    const cleanLastName = (body.lastName || '').trim();
    const cleanEmail = (body.email || '').trim().toLowerCase();
    const cleanPhone = body.phone ? body.phone.trim() : null;
    const password = body.password || 'password123';
    const rawRole = (body.role || 'TEACHER').trim().toUpperCase();

    let roleCode = 'TEACHER';
    let roleName = 'Teacher';
    if (rawRole === 'SCHOOL_ADMIN' || rawRole === 'ADMIN' || rawRole.includes('ADMIN')) {
      roleCode = 'SCHOOL_ADMIN';
      roleName = 'School Admin';
    } else if (rawRole === 'PRINCIPAL' || rawRole.includes('PRINCIPAL')) {
      roleCode = 'PRINCIPAL';
      roleName = 'Principal';
    } else if (rawRole === 'CLASS_TEACHER') {
      roleCode = 'CLASS_TEACHER';
      roleName = 'Class Teacher';
    }

    // 1. Create or update User in `users` table
    let userId: string | null = null;
    try {
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        userId = existingUser.id;
        await this.supabase
          .from('users')
          .update({
            first_name: cleanFirstName || existingUser.first_name,
            last_name: cleanLastName || existingUser.last_name,
            phone: cleanPhone,
            status: 'ACTIVE',
          })
          .eq('id', userId);
      } else {
        const { data: newUser, error: uErr } = await this.supabase
          .from('users')
          .insert({
            email: cleanEmail,
            first_name: cleanFirstName,
            last_name: cleanLastName,
            phone: cleanPhone,
            password_hash: password,
            status: 'ACTIVE',
          })
          .select('id')
          .single();

        if (uErr) {
          console.error('User insert error:', uErr);
          throw uErr;
        }
        userId = newUser?.id || null;
      }
    } catch (e: any) {
      console.error('Error creating user for staff:', e);
      throw new Error(e.message || 'Failed to create user account for staff.');
    }

    if (!userId) {
      throw new Error('Failed to create or find staff user record.');
    }

    // 2. Find or create Role in `roles` table
    let roleId: string | null = null;
    try {
      const { data: roles } = await this.supabase
        .from('roles')
        .select('id, code')
        .or(`code.eq.${roleCode},code.eq.${roleCode === 'CLASS_TEACHER' ? 'TEACHER' : roleCode}`)
        .limit(1);

      if (roles && roles.length > 0) {
        roleId = roles[0].id;
      } else {
        const { data: newRole } = await this.supabase
          .from('roles')
          .insert({
            name: roleName,
            code: roleCode,
            description: `${roleName} role for school operations`,
            is_system_role: true,
            status: 'ACTIVE',
          })
          .select('id')
          .single();
        roleId = newRole?.id || null;
      }
    } catch (rErr) {
      console.warn('Role lookup warning:', rErr);
    }

    // 3. Link in `user_school_roles`
    if (roleId) {
      try {
        const { data: existingRoleLink } = await this.supabase
          .from('user_school_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('school_id', schoolId)
          .limit(1);

        if (existingRoleLink && existingRoleLink.length > 0) {
          await this.supabase
            .from('user_school_roles')
            .update({ role_id: roleId, status: 'ACTIVE' })
            .eq('id', existingRoleLink[0].id);
        } else {
          await this.supabase.from('user_school_roles').insert({
            user_id: userId,
            school_id: schoolId,
            role_id: roleId,
            status: 'ACTIVE',
          });
        }
      } catch (usrErr) {
        console.warn('user_school_roles insert warning:', usrErr);
      }
    }

    // 4. If class teacher section selected, assign in `sections`
    const classTeacherSecId = body.classTeacherSectionId || (rawRole === 'CLASS_TEACHER' ? body.sectionId : null);
    if (classTeacherSecId) {
      try {
        await this.supabase
          .from('sections')
          .update({ class_teacher_id: userId })
          .eq('id', classTeacherSecId);
      } catch (secErr) {
        console.warn('Class teacher section update warning:', secErr);
      }
    }

    // 5. If subject assignment selected, assign in `subject_teachers`
    if (body.sectionId && body.subjectId) {
      try {
        await this.supabase.from('subject_teachers').insert({
          section_id: body.sectionId,
          subject_id: body.subjectId,
          teacher_id: userId,
        });
      } catch (stErr) {
        console.warn('Subject teacher assignment warning:', stErr);
      }
    }

    return {
      success: true,
      id: userId,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      fullName: `${cleanFirstName} ${cleanLastName}`.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      role: roleCode,
      status: 'ACTIVE',
      message: `Staff member ${cleanFirstName} registered successfully!`,
    };
  }

  private async updateStaffStatus(staffUserId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<any> {
    const schoolId = this.getSchoolId();
    const cleanStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    if (schoolId) {
      try {
        await this.supabase
          .from('user_school_roles')
          .update({ status: cleanStatus, updated_at: new Date().toISOString() })
          .eq('user_id', staffUserId)
          .eq('school_id', schoolId);
      } catch (e) {
        console.warn('Failed to update user_school_roles status:', e);
      }
    }

    try {
      await this.supabase
        .from('users')
        .update({ status: cleanStatus, updated_at: new Date().toISOString() })
        .eq('id', staffUserId);
    } catch (e) {
      console.warn('Failed to update users status:', e);
    }

    return { success: true, status: cleanStatus, message: `Staff member marked as ${cleanStatus}` };
  }

  private async updateStudentStatus(studentId: string, status: 'ACTIVE' | 'INACTIVE', reason?: string): Promise<any> {
    const schoolId = this.getSchoolId();
    const cleanStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      let query = this.supabase
        .from('students')
        .update({ status: cleanStatus, updated_at: new Date().toISOString() })
        .eq('id', studentId);
      if (schoolId) query = query.eq('school_id', schoolId);
      await query;
    } catch (e) {
      console.warn('Failed to update students table status:', e);
    }

    try {
      await this.supabase
        .from('student_enrollments')
        .update({ status: cleanStatus, updated_at: new Date().toISOString() })
        .eq('student_id', studentId);
    } catch (e) {
      console.warn('Failed to update student_enrollments status:', e);
    }

    // Save in local cache overrides for seamless sync
    try {
      const raw = localStorage.getItem('schoolsense_student_statuses') || '{}';
      const map = JSON.parse(raw);
      map[studentId] = { status: cleanStatus, reason: reason || '', updated_at: new Date().toISOString() };
      localStorage.setItem('schoolsense_student_statuses', JSON.stringify(map));
    } catch {}

    return { success: true, status: cleanStatus, message: `Student status updated to ${cleanStatus}` };
  }

  private async getStudentDeactivationRequests(): Promise<any[]> {
    const schoolId = this.getSchoolId();
    let dbRequests: any[] = [];
    try {
      let query = this.supabase
        .from('student_deactivation_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (schoolId) query = query.eq('school_id', schoolId);
      const { data, error } = await query;
      if (!error && data) dbRequests = data;
    } catch (e) {
      console.warn('Query student_deactivation_requests failed:', e);
    }

    let localRequests: any[] = [];
    try {
      const raw = localStorage.getItem('schoolsense_deactivation_requests');
      if (raw) localRequests = JSON.parse(raw);
    } catch {}

    const combinedMap = new Map<string, any>();
    for (const r of dbRequests) combinedMap.set(r.id, r);
    for (const r of localRequests) {
      if (!schoolId || r.school_id === schoolId) {
        if (!combinedMap.has(r.id)) {
          combinedMap.set(r.id, r);
        } else {
          // Local override if updated
          const existing = combinedMap.get(r.id);
          if (r.status !== existing.status || r.reviewed_at) {
            combinedMap.set(r.id, { ...existing, ...r });
          }
        }
      }
    }

    return Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  private async submitStudentDeactivationRequest(payload: any): Promise<any> {
    const schoolId = this.getSchoolId();
    const currentUser = this.getCurrentUser();

    const requestObj = {
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      school_id: schoolId || '',
      student_id: payload.studentId,
      student_name: payload.studentName,
      admission_number: payload.admissionNumber || '',
      class_name: payload.className || '',
      section_name: payload.sectionName || '',
      requested_by_user_id: currentUser?.id || '',
      requested_by_name: `${currentUser?.firstName || currentUser?.first_name || ''} ${currentUser?.lastName || currentUser?.last_name || ''}`.trim() || 'Teacher',
      requested_by_role: currentUser?.role || 'TEACHER',
      reason: payload.reason || 'Other',
      comments: payload.comments || '',
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    try {
      await this.supabase.from('student_deactivation_requests').insert(requestObj);
    } catch (e) {
      console.warn('Direct insert to student_deactivation_requests table failed, caching locally:', e);
    }

    try {
      const raw = localStorage.getItem('schoolsense_deactivation_requests');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(requestObj);
      localStorage.setItem('schoolsense_deactivation_requests', JSON.stringify(list));
    } catch {}

    return {
      success: true,
      request: requestObj,
      message: 'Student deactivation request submitted to School Administration for review.',
    };
  }

  private async reviewStudentDeactivationRequest(
    requestId: string,
    action: 'APPROVE' | 'REJECT',
    reviewNotes?: string
  ): Promise<any> {
    const currentUser = this.getCurrentUser();
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const reviewData = {
      status: newStatus,
      reviewed_by_user_id: currentUser?.id || '',
      reviewed_by_name: `${currentUser?.firstName || currentUser?.first_name || ''} ${currentUser?.lastName || currentUser?.last_name || ''}`.trim() || 'Administrator',
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes || '',
    };

    try {
      await this.supabase
        .from('student_deactivation_requests')
        .update(reviewData)
        .eq('id', requestId);
    } catch (e) {
      console.warn('Supabase update student_deactivation_requests failed:', e);
    }

    let targetStudentId: string | null = null;
    let targetReason = 'Approved by administration from teacher request';
    try {
      const raw = localStorage.getItem('schoolsense_deactivation_requests');
      if (raw) {
        const list = JSON.parse(raw);
        const idx = list.findIndex((r: any) => r.id === requestId);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...reviewData };
          targetStudentId = list[idx].student_id;
          targetReason = list[idx].reason || targetReason;
          localStorage.setItem('schoolsense_deactivation_requests', JSON.stringify(list));
        }
      }
    } catch {}

    if (action === 'APPROVE' && targetStudentId) {
      await this.updateStudentStatus(targetStudentId, 'INACTIVE', targetReason);
    }

    return {
      success: true,
      status: newStatus,
      message: `Deactivation request ${newStatus.toLowerCase()} successfully.${
        action === 'APPROVE' ? ' Student has been marked inactive.' : ''
      }`,
    };
  }

  // Student Section Mapping Helpers (ensures seamless roster sync across views)
  public getStudentSectionMap(): Record<string, { classId?: string; className?: string; sectionId?: string; sectionName?: string; rollNumber?: string }> {
    try {
      const raw = localStorage.getItem('schoolsense_student_sections');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  public setStudentSection(
    studentId: string,
    info: { classId?: string; className?: string; sectionId?: string; sectionName?: string; rollNumber?: string }
  ): void {
    try {
      const map = this.getStudentSectionMap();
      map[studentId] = { ...(map[studentId] || {}), ...info };
      localStorage.setItem('schoolsense_student_sections', JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to save student section mapping', e);
    }
  }

  private async getSectionStudents(sectionId: string, academicYearId?: string): Promise<StudentItem[]> {
    const schoolId = this.getSchoolId();
    const effectiveYearId = academicYearId || (await this.getActiveAcademicYearId(schoolId));

    if (effectiveYearId) {
      await this.ensureSessionEnrollments(schoolId, effectiveYearId);
    }

    // Fetch section and parent class info
    let secName = '';
    let clsName = '';
    let classId = '';
    try {
      const { data: sec } = await this.supabase
        .from('sections')
        .select('id, name, class_id, class:classes(id, name)')
        .eq('id', sectionId)
        .maybeSingle();
      secName = sec?.name || '';
      clsName = (sec?.class as any)?.name || '';
      classId = sec?.class_id || (sec?.class as any)?.id || '';
    } catch {}

    let enrollments: any[] = [];
    try {
      let query = this.supabase
        .from('student_enrollments')
        .select('*, student:students(*)')
        .eq('section_id', sectionId)
        .neq('status', 'INACTIVE');

      if (effectiveYearId) {
        query = query.eq('academic_year_id', effectiveYearId);
      }

      const { data, error } = await query;
      if (!error && data) {
        enrollments = data;
      }
    } catch (e) {
      console.warn('Query student_enrollments failed:', e);
    }

    if (enrollments && enrollments.length > 0) {
      return enrollments
        .filter((e: any) => e.student)
        .map((e: any) => {
          const st = e.student || {};
          const fullName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.admission_number || 'Student';
          return {
            id: st.id || e.id,
            enrollmentId: e.id,
            studentId: st.id,
            admissionNumber: st.admission_number || '',
            firstName: st.first_name || '',
            lastName: st.last_name || '',
            fullName,
            rollNumber: Number(e.roll_number) || 1,
            gender: st.gender || 'MALE',
            dateOfBirth: st.date_of_birth,
            bloodGroup: st.blood_group,
            className: clsName,
            sectionName: secName,
            primaryContact: {
              first_name: st.emergency_contact_name || 'Guardian',
              last_name: '',
              phone: st.emergency_contact_phone || '',
              email: '',
              relationship: 'Guardian',
            },
            status: e.status || st.status || 'ACTIVE',
          };
        })
        .sort((a, b) => a.rollNumber - b.rollNumber);
    }

    // Fallback: If this is the active/base session and enrollments haven't synced yet, resolve from local mapping & students table
    try {
      const { data: activeYears } = await this.supabase
        .from('academic_years')
        .select('id, is_current')
        .eq('school_id', schoolId)
        .eq('is_current', true);
      const isBaseSession = !effectiveYearId || (activeYears && activeYears.length > 0 && activeYears[0].id === effectiveYearId);

      if (isBaseSession) {
        const localMap = this.getStudentSectionMap();
        const matchedStudentIds = Object.entries(localMap)
          .filter(([_, info]) => info.sectionId === sectionId)
          .map(([sid]) => sid);

        if (matchedStudentIds.length > 0) {
          const { data: matchedStudents } = await this.supabase
            .from('students')
            .select('*')
            .in('id', matchedStudentIds)
            .neq('status', 'INACTIVE');

          if (matchedStudents && matchedStudents.length > 0) {
            return matchedStudents
              .map((st: any) => {
                const info = localMap[st.id] || {};
                const fullName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.admission_number || 'Student';
                return {
                  id: st.id,
                  enrollmentId: st.id,
                  studentId: st.id,
                  admissionNumber: st.admission_number || '',
                  firstName: st.first_name || '',
                  lastName: st.last_name || '',
                  fullName,
                  rollNumber: Number(info.rollNumber) || 1,
                  gender: st.gender || 'MALE',
                  dateOfBirth: st.date_of_birth,
                  bloodGroup: st.blood_group,
                  className: clsName,
                  sectionName: secName,
                  primaryContact: {
                    first_name: st.emergency_contact_name || 'Guardian',
                    last_name: '',
                    phone: st.emergency_contact_phone || '',
                    email: '',
                    relationship: 'Guardian',
                  },
                  status: st.status || 'ACTIVE',
                };
              })
              .sort((a, b) => a.rollNumber - b.rollNumber);
          }
        }
      }
    } catch {}

    return [];
  }

  private async getSections(): Promise<any[]> {
    const schoolId = this.getSchoolId();
    let query = this.supabase.from('sections').select('*, class:classes(name, code)');
    if (schoolId) query = query.eq('school_id', schoolId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async getAttendance(sectionId: string, date: string): Promise<AttendanceRegisterResponse> {
    const { data: students } = await this.supabase
      .from('student_enrollments')
      .select('*, student:students(*)')
      .eq('section_id', sectionId);

    const { data: records } = await this.supabase
      .from('attendance')
      .select('*')
      .eq('section_id', sectionId)
      .eq('date', date);

    const recordMap = new Map((records || []).map((r: any) => [r.student_id, r]));

    const register = (students || []).map((e: any) => {
      const rec = recordMap.get(e.student?.id);
      return {
        studentId: e.student?.id,
        rollNumber: e.roll_number || '1',
        admissionNumber: e.student?.admission_number || '',
        name: `${e.student?.first_name || ''} ${e.student?.last_name || ''}`.trim(),
        status: (rec?.status as any) || 'NOT_MARKED',
        reason: rec?.remarks,
        markedAt: rec?.created_at,
      };
    });

    const presentCount = register.filter((r) => r.status === 'PRESENT').length;
    const absentCount = register.filter((r) => r.status === 'ABSENT').length;
    const lateCount = register.filter((r) => r.status === 'LATE').length;

    return {
      sectionId,
      date,
      summary: {
        totalStudents: register.length,
        presentCount,
        absentCount,
        lateCount,
        attendancePercentage:
          register.length > 0 ? ((presentCount / register.length) * 100).toFixed(1) : '0.0',
      },
      register,
    };
  }

  private async getHomework(sectionId: string): Promise<HomeworkItem[]> {
    const { data, error } = await this.supabase
      .from('homework')
      .select('*, subject:subjects(*), teacher:users(*)')
      .eq('section_id', sectionId)
      .order('due_date', { ascending: false });
    if (error) throw error;
    return (data || []).map((h: any) => ({
      id: h.id,
      section_id: h.section_id,
      class_subject_id: '',
      teacher_id: h.assigned_by_id,
      title: h.title,
      description: h.description,
      assigned_date: h.created_at,
      due_date: h.due_date,
      status: h.status,
      class_subject: {
        subject: {
          id: h.subject?.id,
          name: h.subject?.name,
          code: h.subject?.code,
          subject_type: 'THEORY',
          display_order: 0,
        },
      },
      teacher: {
        id: h.teacher?.id,
        first_name: h.teacher?.first_name,
        last_name: h.teacher?.last_name,
      },
    }));
  }

  private async getExams(): Promise<Exam[]> {
    const schoolId = this.getSchoolId();
    let query = this.supabase.from('exams').select('*, exam_schedules(*, subject:subjects(*), class:classes(*))');
    if (schoolId) query = query.eq('school_id', schoolId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((e: any) => ({
      id: e.id,
      name: e.name,
      code: e.code,
      start_date: e.start_date,
      end_date: e.end_date,
      status: e.status,
      exam_subjects: (e.exam_schedules || []).map((es: any) => ({
        id: es.id,
        exam_date: es.exam_date,
        start_time: es.start_time,
        end_time: es.end_time,
        max_marks: Number(es.max_marks) || 100,
        passing_marks: Number(es.passing_marks) || 33,
        class_subject: {
          subject: {
            id: es.subject?.id,
            name: es.subject?.name,
            code: es.subject?.code,
            subject_type: 'THEORY',
            display_order: 0,
          },
          class: {
            id: es.class?.id,
            name: es.class?.name,
            code: es.class?.code,
            display_order: 0,
            sections: [],
          },
        },
      })),
    }));
  }

  private async getNotices(): Promise<Notice[]> {
    const schoolId = this.getSchoolId();
    let query = this.supabase.from('notices').select('*, publisher:users(*)').order('created_at', { ascending: false });
    if (schoolId) query = query.eq('school_id', schoolId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      target_audience: n.target_audience?.[0] || 'ALL',
      published_at: n.publish_date || n.created_at,
      publisher: {
        first_name: n.publisher?.first_name,
        last_name: n.publisher?.last_name,
      },
    }));
  }

  private async getEvents(): Promise<SchoolEventItem[]> {
    const schoolId = this.getSchoolId();
    let query = this.supabase.from('school_events').select('*').order('start_date', { ascending: true });
    if (schoolId) query = query.eq('school_id', schoolId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((ev: any) => ({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      start_time: ev.start_date,
      end_time: ev.end_date,
      location: ev.location,
      is_holiday: ev.is_holiday,
      target_audience: 'ALL',
    }));
  }

  private async getComplaints(params?: Record<string, any>): Promise<ComplaintItem[]> {
    const schoolId = this.getSchoolId();
    let query = this.supabase.from('complaints').select('*, sender:users(*), messages:complaint_messages(*, sender:users(*))');
    if (schoolId) query = query.eq('school_id', schoolId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((c: any) => ({
      id: c.id,
      ticket_number: c.id.slice(0, 8).toUpperCase(),
      category: c.category,
      subject: c.title,
      status: c.status,
      priority: c.priority,
      created_at: c.created_at,
      users: {
        id: c.sender?.id,
        first_name: c.sender?.first_name,
        last_name: c.sender?.last_name,
        email: c.sender?.email,
      },
      messages: (c.messages || []).map((m: any) => ({
        id: m.id,
        message: m.message,
        is_internal_note: false,
        created_at: m.created_at,
        sender: {
          id: m.sender?.id,
          first_name: m.sender?.first_name,
          last_name: m.sender?.last_name,
        },
      })),
    }));
  }

  // Local Parent-Student cache helpers
  private getLocalParentStudentMap(): Record<string, any> {
    try {
      return JSON.parse(localStorage.getItem('schoolsense_parent_students') || '{}');
    } catch {
      return {};
    }
  }

  private saveLocalParentStudentMap(studentId: string, info: any) {
    try {
      const map = this.getLocalParentStudentMap();
      map[studentId] = { ...(map[studentId] || {}), ...info };
      localStorage.setItem('schoolsense_parent_students', JSON.stringify(map));
    } catch {}
  }

  private async getMyChildren(): Promise<any[]> {
    const currentUser = this.getCurrentUser();
    const userId = currentUser?.id || this.getUserId();
    const schoolId = currentUser?.school?.id || this.getSchoolId();

    if (!userId && !currentUser) return [];

    // Check if children are already present on currentUser profile
    if (currentUser?.children && currentUser.children.length > 0) {
      return currentUser.children;
    }

    try {
      // 1. Query student_guardians joined with guardians and students
      const { data: sgData, error: sgErr } = await this.supabase
        .from('student_guardians')
        .select(`
          id, relationship, is_primary_contact,
          guardian:guardians!inner(id, user_id, school_id),
          student:students!inner(
            id, first_name, last_name, admission_number, status, emergency_contact_name, emergency_contact_phone,
            student_enrollments(id, roll_number, status, class:classes(id, name), section:sections(id, name))
          )
        `)
        .eq('guardian.user_id', userId);

      if (!sgErr && sgData && sgData.length > 0) {
        return sgData.map((sg: any) => {
          const st = sg.student || {};
          const enr = st.student_enrollments?.[0];
          const fullName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.admission_number || 'Student';
          return {
            id: st.id,
            studentId: st.id,
            name: fullName,
            firstName: st.first_name,
            lastName: st.last_name || '',
            admissionNumber: st.admission_number,
            rollNumber: enr?.roll_number || '1',
            className: enr?.class?.name || 'Class 1',
            sectionName: enr?.section?.name || 'Section A',
            classId: enr?.class?.id,
            sectionId: enr?.section?.id,
            relationship: sg.relationship || 'Parent',
            status: st.status || 'ACTIVE',
          };
        });
      }
    } catch (e) {
      console.warn('Query student_guardians error, falling back:', e);
    }

    // 2. Direct Fallback: match by student emergency contacts or user email/phone in this school
    if (schoolId) {
      try {
        const { data: students } = await this.supabase
          .from('students')
          .select('*, student_enrollments(*, class:classes(id, name), section:sections(id, name))')
          .eq('school_id', schoolId)
          .eq('status', 'ACTIVE');

        if (students && students.length > 0) {
          const userEmail = (currentUser?.email || '').toLowerCase();
          const userPhone = (currentUser?.phone || '').trim();
          const userFirst = (currentUser?.firstName || '').toLowerCase().trim();

          const parentMap = this.getLocalParentStudentMap();

          // Match by user email/phone in local mapping, or matching phone / name
          const matched = students.filter((s: any) => {
            const mapped = parentMap[s.id];
            if (mapped && (mapped.guardianEmail === userEmail || mapped.parentUserId === userId || (userPhone && mapped.guardianPhone === userPhone))) {
              return true;
            }
            const emPhone = (s.emergency_contact_phone || '').trim();
            const emName = (s.emergency_contact_name || '').toLowerCase().trim();
            return (userPhone && emPhone === userPhone) || (userFirst && userFirst !== 'parent' && emName.includes(userFirst));
          });

          const targetStudents = matched.length > 0 ? matched : students.slice(0, 1);
          return targetStudents.map((st: any) => {
            const enr = st.student_enrollments?.[0];
            const fullName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.admission_number || 'Student';
            return {
              id: st.id,
              studentId: st.id,
              name: fullName,
              firstName: st.first_name,
              lastName: st.last_name || '',
              admissionNumber: st.admission_number,
              rollNumber: enr?.roll_number || '1',
              className: enr?.class?.name || 'Class 1',
              sectionName: enr?.section?.name || 'Section A',
              classId: enr?.class?.id,
              sectionId: enr?.section?.id,
              relationship: 'Parent',
              status: st.status || 'ACTIVE',
            };
          });
        }
      } catch (err) {
        console.warn('Fallback students query failed:', err);
      }
    }

    return [];
  }

  private async getMyChildTimetable(studentId?: string): Promise<any> {
    const children = await this.getMyChildren();
    const selectedChild = studentId ? children.find((c) => c.studentId === studentId) || children[0] : children[0];

    let periods: any[] = [];
    let availableSubjects: any[] = [];

    if (selectedChild?.sectionId) {
      periods = await this.getTimetable(selectedChild.sectionId);
    } else if (selectedChild) {
      const sections = await this.getSections();
      if (sections.length > 0) {
        periods = await this.getTimetable(sections[0].id);
      }
    }

    try {
      availableSubjects = await this.getSubjects();
    } catch {}

    return {
      childrenList: children,
      selectedChild: selectedChild || null,
      timetable: {
        periods,
        availableSubjects,
      },
    };
  }

  private async getMyChildrenAttendance(studentId?: string, academicYearId?: string): Promise<any> {
    const children = await this.getMyChildren();
    const selectedChild = studentId ? children.find((c) => c.studentId === studentId) || children[0] : children[0];

    let records: any[] = [];
    if (selectedChild) {
      try {
        const { data } = await this.supabase
          .from('attendance')
          .select('*')
          .eq('student_id', selectedChild.studentId)
          .order('date', { ascending: false });
        records = data || [];
      } catch {}
    }

    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const totalDays = records.length || 1;
    const percentage = ((presentCount / totalDays) * 100).toFixed(1);

    return {
      childrenList: children,
      selectedChild: selectedChild || null,
      stats: {
        totalDays: records.length,
        presentDays: presentCount,
        absentDays: records.filter((r) => r.status === 'ABSENT').length,
        percentage: Number(percentage),
      },
      records,
    };
  }

  private async getTimetable(sectionId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('timetable_periods')
      .select('*, subject:subjects(*), teacher:users(*)')
      .eq('section_id', sectionId);
    if (error) throw error;
    return data || [];
  }

  private async getTeacherTimetable(teacherId?: string): Promise<any[]> {
    const id = teacherId || this.getUserId();
    const { data, error } = await this.supabase
      .from('timetable_periods')
      .select('*, subject:subjects(*), section:sections(*, class:classes(*))')
      .eq('teacher_id', id);
    if (error) throw error;
    return data || [];
  }

  // --- CRUD Actions ---

  private async createSubject(body: any): Promise<SubjectItem> {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context required');

    const subjectName = (body.name || '').trim();
    const subjectCode = (body.code || '').trim().toUpperCase();
    const subjectType = body.subject_type || body.subjectType || 'THEORY';

    if (!subjectName || !subjectCode) {
      throw new Error('Subject name and code are required.');
    }

    // 1. Check if subject exists with same code in this school
    let subjectData: any = null;
    const { data: existing } = await this.supabase
      .from('subjects')
      .select('*')
      .eq('school_id', schoolId)
      .eq('code', subjectCode)
      .maybeSingle();

    if (existing) {
      subjectData = existing;
      await this.supabase
        .from('subjects')
        .update({ name: subjectName, type: subjectType })
        .eq('id', existing.id);
    } else {
      const { data: created, error } = await this.supabase
        .from('subjects')
        .insert({
          school_id: schoolId,
          name: subjectName,
          code: subjectCode,
          type: subjectType,
        })
        .select()
        .single();
      if (error) throw error;
      subjectData = created;
    }

    // 2. Class and Section association
    const sectionIds: string[] = body.section_ids || body.sectionIds || [];
    const classId: string = body.class_id || body.classId || '';
    const className: string = body.class_name || body.className || '';
    const isAllSections: boolean = body.is_all_sections ?? body.isAllSections ?? (sectionIds.length === 0);

    if (subjectData && subjectData.id) {
      // Create records in subject_teachers if sectionIds are specified
      for (const secId of sectionIds) {
        try {
          const { data: existingSt } = await this.supabase
            .from('subject_teachers')
            .select('id')
            .eq('subject_id', subjectData.id)
            .eq('section_id', secId)
            .maybeSingle();

          if (!existingSt) {
            await this.supabase.from('subject_teachers').insert({
              subject_id: subjectData.id,
              section_id: secId,
              teacher_id: body.teacher_id || null,
            });
          }
        } catch (stErr) {
          console.warn('subject_teachers insert note:', stErr);
        }
      }

      // Persist in localStorage section subjects map
      try {
        const map = this.getSectionSubjectMap();
        map[subjectData.id] = {
          subject_id: subjectData.id,
          name: subjectName,
          code: subjectCode,
          subject_type: subjectType,
          class_id: classId,
          class_name: className,
          section_ids: sectionIds,
          is_all_sections: isAllSections,
        };
        localStorage.setItem('schoolsense_section_subjects', JSON.stringify(map));
      } catch (mErr) {
        console.warn('Failed to save section subjects map:', mErr);
      }
    }

    return {
      id: subjectData.id,
      name: subjectData.name,
      code: subjectData.code,
      subject_type: subjectData.type || subjectType,
      display_order: 0,
      description: body.description || '',
      class_id: classId,
      class_name: className,
      section_ids: sectionIds,
      is_all_sections: isAllSections,
    };
  }

  private async deleteSubject(id: string) {
    try {
      await this.supabase.from('subject_teachers').delete().eq('subject_id', id);
    } catch {}

    const { error } = await this.supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;

    try {
      const map = this.getSectionSubjectMap();
      delete map[id];
      localStorage.setItem('schoolsense_section_subjects', JSON.stringify(map));
    } catch {}

    return { success: true };
  }

  private async getActiveAcademicYearId(schoolId: string): Promise<string> {
    try {
      const stored = localStorage.getItem('schoolsense_active_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) return parsed.id;
        } catch {}
      }

      const { data: year } = await this.supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', schoolId)
        .eq('is_current', true)
        .maybeSingle();

      if (year?.id) return year.id;

      // Fallback: get first active year
      const { data: anyYear } = await this.supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (anyYear?.id) return anyYear.id;

      // Create initial academic year 2026-2027 if none exists
      const { data: newYear } = await this.supabase
        .from('academic_years')
        .insert({
          school_id: schoolId,
          name: '2026-2027',
          start_date: '2026-04-01',
          end_date: '2027-03-31',
          is_current: true,
          status: 'ACTIVE',
        })
        .select()
        .single();

      return newYear?.id || '';
    } catch {
      return '';
    }
  }

  private async createClass(body: any) {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context required');

    const className = body.name?.trim();
    if (!className) throw new Error('Class name is required');

    let classCode = body.code?.trim().toUpperCase();
    if (!classCode) {
      classCode = className.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    }

    const { data: createdClass, error: classErr } = await this.supabase
      .from('classes')
      .insert({
        school_id: schoolId,
        name: className,
        code: classCode,
        display_order: Number(body.display_order) || getClassPedagogicalRank(className, classCode),
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (classErr) {
      if (classErr.code === '23505' || classErr.message?.includes('duplicate key') || classErr.message?.includes('unique constraint')) {
        throw new Error(`A class named "${className}" (code: ${classCode}) already exists in your school.`);
      }
      throw classErr;
    }

    // Resolve Academic Year
    const academicYearId = body.academic_year_id || (await this.getActiveAcademicYearId(schoolId));

    // Handle sections list or default Section A
    const rawSections = Array.isArray(body.sections) && body.sections.length > 0 
      ? body.sections 
      : [{ name: 'Section A', code: 'A', capacity: Number(body.capacity) || 40 }];

    const sectionInserts = rawSections.map((sec: any, idx: number) => {
      let secName = typeof sec === 'string' ? sec.trim() : (sec.name?.trim() || 'Section A');
      // If single letter provided (e.g. 'A', 'B'), format nicely as 'Section A' if not already
      if (/^[A-Z]$/i.test(secName)) {
        secName = `Section ${secName.toUpperCase()}`;
      }
      const rawCode = typeof sec === 'string' ? sec.replace(/^section\s+/i, '').trim() : (sec.code || secName.replace(/^section\s+/i, '').trim());
      const secCode = (rawCode || 'A').toUpperCase().slice(0, 10);

      return {
        school_id: schoolId,
        class_id: createdClass.id,
        academic_year_id: academicYearId,
        name: secName,
        code: secCode,
        capacity: typeof sec === 'object' && sec.capacity ? Number(sec.capacity) : (Number(body.capacity) || 40),
        display_order: idx + 1,
        status: 'ACTIVE',
      };
    });

    if (sectionInserts.length > 0) {
      const { error: secErr } = await this.supabase.from('sections').insert(sectionInserts);
      if (secErr) {
        if (secErr.code === '23505' || secErr.message?.includes('duplicate key')) {
          throw new Error(`One or more sections already exist in this class.`);
        }
        throw secErr;
      }
    }

    return createdClass;
  }

  private async createSection(body: any) {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context required');
    if (!body.class_id) throw new Error('Class ID is required to create a section');

    const academicYearId = body.academic_year_id || (await this.getActiveAcademicYearId(schoolId));
    let secName = body.name?.trim() || 'Section A';
    if (/^[A-Z]$/i.test(secName)) {
      secName = `Section ${secName.toUpperCase()}`;
    }
    const rawCode = body.code?.trim() || secName.replace(/^section\s+/i, '').trim();
    const secCode = (rawCode || 'A').toUpperCase().slice(0, 10);

    const { data, error } = await this.supabase
      .from('sections')
      .insert({
        school_id: schoolId,
        class_id: body.class_id,
        academic_year_id: academicYearId,
        name: secName,
        code: secCode,
        capacity: Number(body.capacity) || 40,
        display_order: Number(body.display_order) || 0,
        class_teacher_id: body.class_teacher_id || null,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        throw new Error(`A section named "${secName}" already exists for this class.`);
      }
      throw error;
    }
    return data;
  }

  private async seedStandardClasses(): Promise<any> {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context required');

    const academicYearId = await this.getActiveAcademicYearId(schoolId);

    const standardGrades = [
      { name: 'Nursery', code: 'NUR', order: 1 },
      { name: 'LKG', code: 'LKG', order: 2 },
      { name: 'UKG', code: 'UKG', order: 3 },
      { name: 'Class 1', code: 'CLS-01', order: 4 },
      { name: 'Class 2', code: 'CLS-02', order: 5 },
      { name: 'Class 3', code: 'CLS-03', order: 6 },
      { name: 'Class 4', code: 'CLS-04', order: 7 },
      { name: 'Class 5', code: 'CLS-05', order: 8 },
      { name: 'Class 6', code: 'CLS-06', order: 9 },
      { name: 'Class 7', code: 'CLS-07', order: 10 },
      { name: 'Class 8', code: 'CLS-08', order: 11 },
      { name: 'Class 9', code: 'CLS-09', order: 12 },
      { name: 'Class 10', code: 'CLS-10', order: 13 },
      { name: 'Class 11', code: 'CLS-11', order: 14 },
      { name: 'Class 12', code: 'CLS-12', order: 15 },
    ];

    const results = [];
    for (const g of standardGrades) {
      // Check if class already exists
      const { data: existingClass } = await this.supabase
        .from('classes')
        .select('id')
        .eq('school_id', schoolId)
        .eq('name', g.name)
        .maybeSingle();

      let classId = existingClass?.id;
      if (!classId) {
        const { data: newClass } = await this.supabase
          .from('classes')
          .insert({
            school_id: schoolId,
            name: g.name,
            code: g.code,
            display_order: g.order,
            status: 'ACTIVE',
          })
          .select()
          .single();
        classId = newClass?.id;
      }

      if (classId) {
        // Ensure Section A and Section B
        for (const secLetter of ['A', 'B']) {
          const { data: existingSec } = await this.supabase
            .from('sections')
            .select('id')
            .eq('school_id', schoolId)
            .eq('class_id', classId)
            .eq('code', secLetter)
            .maybeSingle();

          if (!existingSec) {
            await this.supabase.from('sections').insert({
              school_id: schoolId,
              class_id: classId,
              academic_year_id: academicYearId,
              name: `Section ${secLetter}`,
              code: secLetter,
              capacity: 40,
              display_order: secLetter === 'A' ? 1 : 2,
              status: 'ACTIVE',
            });
          }
        }
        results.push(g.name);
      }
    }

    return {
      success: true,
      message: `Successfully provisioned ${results.length} standard school classes with Sections A & B!`,
      classesCount: results.length,
    };
  }

  private async saveAttendanceBulk(body: any) {
    const schoolId = this.getSchoolId();
    const userId = this.getUserId();
    const { sectionId, date, records } = body;

    const inserts = (records || []).map((r: any) => ({
      school_id: schoolId,
      section_id: sectionId,
      student_id: r.studentId,
      date: date,
      status: r.status,
      remarks: r.reason,
      marked_by_id: userId || null,
      academic_year_id: r.academicYearId || null,
    }));

    const { data, error } = await this.supabase
      .from('attendance')
      .upsert(inserts, { onConflict: 'student_id,date' });
    if (error) throw error;
    return { success: true, count: inserts.length };
  }

  private async createHomework(body: any) {
    const schoolId = this.getSchoolId();
    const userId = this.getUserId();
    const { data, error } = await this.supabase.from('homework').insert({
      school_id: schoolId,
      section_id: body.section_id,
      subject_id: body.subject_id,
      assigned_by_id: userId,
      title: body.title,
      description: body.description,
      due_date: body.due_date,
    });
    if (error) throw error;
    return data;
  }

  private async createExam(body: any) {
    const schoolId = this.getSchoolId();
    const { data, error } = await this.supabase.from('exams').insert({
      school_id: schoolId,
      name: body.name,
      code: body.code.toUpperCase(),
      start_date: body.start_date,
      end_date: body.end_date,
      status: 'SCHEDULED',
    });
    if (error) throw error;
    return data;
  }

  private async saveMarksBulk(body: any) {
    const schoolId = this.getSchoolId();
    const userId = this.getUserId();
    const inserts = (body.marks || []).map((m: any) => ({
      school_id: schoolId,
      exam_id: body.examId,
      student_id: m.studentId,
      subject_id: body.subjectId,
      marks_obtained: m.marksObtained,
      is_absent: m.isAbsent || false,
      entered_by_id: userId,
    }));

    const { data, error } = await this.supabase
      .from('student_marks')
      .upsert(inserts, { onConflict: 'exam_id,student_id,subject_id' });
    if (error) throw error;
    return data;
  }

  private async createNotice(body: any) {
    const schoolId = this.getSchoolId();
    const userId = this.getUserId();
    const { data, error } = await this.supabase.from('notices').insert({
      school_id: schoolId,
      published_by_id: userId,
      title: body.title,
      content: body.content,
      target_audience: [body.target_audience || 'ALL'],
      priority: body.priority || 'MEDIUM',
    });
    if (error) throw error;
    return data;
  }

  private async createEvent(body: any) {
    const schoolId = this.getSchoolId();
    const userId = this.getUserId();
    const { data, error } = await this.supabase.from('school_events').insert({
      school_id: schoolId,
      created_by_id: userId,
      title: body.title,
      description: body.description,
      start_date: body.start_time,
      end_date: body.end_time,
      location: body.location,
      is_holiday: body.is_holiday || false,
    });
    if (error) throw error;
    return data;
  }

  private async createComplaint(body: any) {
    const schoolId = this.getSchoolId();
    const userId = this.getUserId();
    const { data, error } = await this.supabase.from('complaints').insert({
      school_id: schoolId,
      submitted_by_id: userId,
      title: body.subject,
      description: body.description,
      category: body.category || 'GENERAL',
      priority: body.priority || 'MEDIUM',
      status: 'OPEN',
    });
    if (error) throw error;
    return data;
  }

  private async updateComplaintStatus(id: string, status: string) {
    const { error } = await this.supabase.from('complaints').update({ status }).eq('id', id);
    if (error) throw error;
    return { success: true };
  }

  private async createTimetablePeriod(body: any) {
    const schoolId = this.getSchoolId();
    const { data, error } = await this.supabase.from('timetable_periods').insert({
      school_id: schoolId,
      section_id: body.sectionId,
      subject_id: body.subjectId,
      teacher_id: body.teacherId,
      day_of_week: body.dayOfWeek,
      period_number: body.periodNumber,
      start_time: body.startTime,
      end_time: body.endTime,
      room_number: body.roomNumber,
    });
    if (error) throw error;
    return data;
  }

  private async deleteTimetablePeriod(id: string) {
    const { error } = await this.supabase.from('timetable_periods').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  }

  // ============================================================================
  // Academic Sessions & Rollover / Promotion Handlers
  // ============================================================================

  private async getAcademicSessions(): Promise<AcademicSession[]> {
    const schoolId = this.getSchoolId();
    if (!schoolId) return [];

    const { data: sessions, error } = await this.supabase
      .from('academic_years')
      .select('*')
      .eq('school_id', schoolId)
      .order('start_date', { ascending: false });
    if (error) {
      console.warn('Failed to fetch academic_years', error);
      return [];
    }

    return (sessions || []).map((s: any) => ({
      id: s.id,
      school_id: s.school_id,
      name: s.name,
      start_date: s.start_date,
      end_date: s.end_date,
      is_current: s.is_current || false,
      status: s.status || 'ACTIVE',
      created_at: s.created_at,
    }));
  }

  private async createAcademicSession(body: any): Promise<any> {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    if (body.isCurrent || body.is_current) {
      await this.supabase.from('academic_years').update({ is_current: false }).eq('school_id', schoolId);
    }
    const { data, error } = await this.supabase
      .from('academic_years')
      .insert({
        school_id: schoolId,
        name: body.name?.trim() || '',
        start_date: body.startDate || body.start_date,
        end_date: body.endDate || body.end_date,
        is_current: body.isCurrent ?? body.is_current ?? false,
        status: 'ACTIVE',
      })
      .select()
      .single();
    if (error) throw error;
    return { success: true, session_id: data.id, ...data };
  }

  private async rolloverStudents(body: any): Promise<any> {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    const fromSessionId = body.fromSessionId || body.from_session_id;
    const toSessionId = body.toSessionId || body.to_session_id;
    if (!toSessionId) throw new Error('Target academic session ID missing');

    // Ensure source session enrollments are ready
    if (fromSessionId) {
      await this.ensureSessionEnrollments(schoolId, fromSessionId);
    }

    // 1. Fetch all classes for the school ordered by display_order ASC
    const { data: allClasses } = await this.supabase
      .from('classes')
      .select('*, sections(*)')
      .eq('school_id', schoolId)
      .order('display_order', { ascending: true });

    const classList = (allClasses || []).sort(
      (a: any, b: any) => getClassPedagogicalRank(a.name, a.code, a.display_order) - getClassPedagogicalRank(b.name, b.code, b.display_order)
    );
    if (classList.length === 0) {
      return { success: true, promoted_count: 0, graduated_alumni_count: 0, graduated_count: 0 };
    }

    // 2. Fetch current enrollments with section
    let enrollments: any[] = [];
    if (fromSessionId) {
      const { data: sessionEnrolls } = await this.supabase
        .from('student_enrollments')
        .select('*, section:sections(*)')
        .eq('academic_year_id', fromSessionId)
        .neq('status', 'INACTIVE');
      if (sessionEnrolls && sessionEnrolls.length > 0) {
        enrollments = sessionEnrolls;
      }
    }

    // Fallback: If no enrollments exist for fromSessionId, query active students with local map
    if (enrollments.length === 0) {
      const localMap = this.getStudentSectionMap();
      const { data: activeStudents } = await this.supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .neq('status', 'INACTIVE');

      enrollments = (activeStudents || []).map((st: any) => {
        const info = localMap[st.id];
        return {
          student_id: st.id,
          roll_number: info?.rollNumber || '1',
          section_id: info?.sectionId || null,
          section: info?.sectionId ? { id: info.sectionId, name: info.sectionName, class_id: info.classId } : null,
        };
      }).filter((e: any) => !!e.student_id);
    }

    let promotedCount = 0;
    let graduatedCount = 0;
    const newEnrollmentsToInsert: any[] = [];
    const graduatedStudentIds: string[] = [];

    for (const e of enrollments) {
      const classId = e.section?.class_id || e.class_id;
      const currentClassIdx = classList.findIndex((c: any) => c.id === classId);

      // If student is in the school's terminal / last class, graduate them to ALUMNI
      if (currentClassIdx === classList.length - 1 || (currentClassIdx === -1 && classList.length === 1)) {
        graduatedStudentIds.push(e.student_id);
        graduatedCount++;
      } else if (currentClassIdx !== -1 && currentClassIdx < classList.length - 1) {
        // Promote to the next class
        const nextClass = classList[currentClassIdx + 1];
        const curSecName = e.section?.name || 'Section A';
        let targetSection = (nextClass.sections || []).find(
          (s: any) => s.name?.trim().toLowerCase() === curSecName.trim().toLowerCase()
        ) || (nextClass.sections || [])[0];

        // Auto-provision section in target class if none exists
        if (!targetSection) {
          try {
            const { data: newSec } = await this.supabase
              .from('sections')
              .insert({
                school_id: schoolId,
                class_id: nextClass.id,
                name: curSecName || 'Section A',
                code: (curSecName || 'A').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'A',
                capacity: 40,
              })
              .select()
              .single();
            targetSection = newSec;
            if (!nextClass.sections) nextClass.sections = [];
            if (newSec) nextClass.sections.push(newSec);
          } catch (secErr) {
            console.warn('Auto create section on rollover note:', secErr);
          }
        }

        if (targetSection?.id) {
          newEnrollmentsToInsert.push({
            student_id: e.student_id,
            section_id: targetSection.id,
            academic_year_id: toSessionId,
            roll_number: e.roll_number || '1',
            status: 'ACTIVE',
          });
          promotedCount++;
        }
      }
    }

    // Update graduated students to ALUMNI in students table
    if (graduatedStudentIds.length > 0) {
      try {
        await this.supabase.from('students').update({ status: 'ALUMNI' }).in('id', graduatedStudentIds);
      } catch (err) {
        console.warn('Mark alumni error:', err);
      }
    }

    // Insert promoted enrollments into student_enrollments in chunks
    const CHUNK_SIZE = 50;
    for (let i = 0; i < newEnrollmentsToInsert.length; i += CHUNK_SIZE) {
      const chunk = newEnrollmentsToInsert.slice(i, i + CHUNK_SIZE);
      await this.supabase.from('student_enrollments').insert(chunk);
    }

    return {
      success: true,
      promoted_count: promotedCount,
      graduated_alumni_count: graduatedCount,
      graduated_count: graduatedCount,
    };
  }

  private async getAlumniStudents(): Promise<AlumniStudent[]> {
    const schoolId = this.getSchoolId();
    if (!schoolId) return [];

    try {
      const { data: students, error } = await this.supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .eq('status', 'ALUMNI');

      if (error || !students) {
        return [];
      }

      const studentIds = students.map((s: any) => s.id);
      let enrollmentsMap: Record<string, any> = {};
      if (studentIds.length > 0) {
        const { data: enrolls } = await this.supabase
          .from('student_enrollments')
          .select('*, section:sections(*, class:classes(*)), academic_year:academic_years(*)')
          .in('student_id', studentIds);
        (enrolls || []).forEach((en: any) => {
          if (!enrollmentsMap[en.student_id]) enrollmentsMap[en.student_id] = en;
        });
      }

      return students.map((st: any) => {
        const lastEnrollment = enrollmentsMap[st.id];
        return {
          student_id: st.id,
          admission_number: st.admission_number,
          first_name: st.first_name,
          last_name: st.last_name,
          full_name: `${st.first_name || ''} ${st.last_name || ''}`.trim(),
          gender: st.gender,
          dateOfBirth: st.date_of_birth,
          status: 'ALUMNI',
          last_class_name: lastEnrollment?.section?.class?.name || lastEnrollment?.class?.name || 'Class 12',
          last_section_name: lastEnrollment?.section?.name || 'Section A',
          graduation_session: lastEnrollment?.academic_year?.name || 'Graduated',
          last_roll_number: lastEnrollment?.roll_number,
        };
      });
    } catch (e) {
      console.warn('Failed to load alumni students', e);
      return [];
    }
  }

  private async deleteAcademicSession(sessionId: string): Promise<any> {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    const { error } = await this.supabase
      .from('academic_years')
      .delete()
      .eq('id', sessionId)
      .eq('school_id', schoolId);

    if (error) {
      console.warn('Delete session error:', error);
      throw new Error(error.message || 'Could not delete academic session');
    }

    return { success: true, message: 'Academic session deleted successfully' };
  }

  // ============================================================================
  // Student Enrollment Handler
  // ============================================================================

  private async createStudent(body: any): Promise<any> {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    let admissionNumber = (body.admissionNumber || `ADM-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`).trim();
    const firstName = (body.firstName || '').trim();
    const lastName = (body.lastName || '').trim();
    const guardianName = (body.guardianName || body.emergencyContactName || '').trim();
    const guardianPhone = (body.guardianPhone || body.emergencyContactPhone || '').trim();

    // Check if admission number already exists for this school to prevent unique constraint error
    try {
      const { data: existingStudent } = await this.supabase
        .from('students')
        .select('id, admission_number')
        .eq('school_id', schoolId)
        .eq('admission_number', admissionNumber)
        .maybeSingle();

      if (existingStudent) {
        admissionNumber = `${admissionNumber}-${String(Date.now()).slice(-4)}`;
      }
    } catch {}

    // Format Date of Birth safely to YYYY-MM-DD
    let dob: string | null = null;
    if (body.dateOfBirth) {
      try {
        const dStr = String(body.dateOfBirth).trim();
        if (dStr.includes('/')) {
          const parts = dStr.split('/');
          if (parts.length === 3) {
            if (parts[2].length === 4) {
              dob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        } else {
          dob = new Date(dStr).toISOString().split('T')[0];
        }
      } catch {
        dob = null;
      }
    }

    const { data: student, error: sErr } = await this.supabase
      .from('students')
      .insert({
        school_id: schoolId,
        admission_number: admissionNumber,
        first_name: firstName,
        last_name: lastName || null,
        gender: body.gender || 'MALE',
        date_of_birth: dob,
        blood_group: body.bloodGroup || null,
        emergency_contact_name: guardianName || null,
        emergency_contact_phone: guardianPhone || null,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (sErr) throw sErr;

    // Determine target session
    const academicYearId = body.academicYearId || (await this.getActiveAcademicYearId(schoolId));

    // Resolve target class and section for this academic session
    let targetSectionId = body.sectionId;
    let resolvedClassName = 'Class 1';
    let resolvedSectionName = 'Section A';
    let targetClassId = body.classId;

    if (body.sectionId) {
      try {
        const { data: sec } = await this.supabase
          .from('sections')
          .select('id, name, code, class_id, academic_year_id, class:classes(id, name)')
          .eq('id', body.sectionId)
          .maybeSingle();

        if (sec) {
          resolvedSectionName = sec.name || 'Section A';
          resolvedClassName = (sec.class as any)?.name || 'Class 1';
          targetClassId = sec.class_id || (sec.class as any)?.id || targetClassId;

          // If sec belongs to a different academic year and academicYearId is set, find or create section for academicYearId
          if (sec.academic_year_id && academicYearId && sec.academic_year_id !== academicYearId) {
            const { data: matchingSec } = await this.supabase
              .from('sections')
              .select('id, name')
              .eq('class_id', targetClassId)
              .eq('academic_year_id', academicYearId)
              .ilike('name', sec.name)
              .maybeSingle();

            if (matchingSec) {
              targetSectionId = matchingSec.id;
            } else {
              const { data: newSec } = await this.supabase
                .from('sections')
                .insert({
                  school_id: schoolId,
                  class_id: targetClassId,
                  academic_year_id: academicYearId,
                  name: sec.name,
                  code: sec.code || 'A',
                  capacity: 40,
                  display_order: 1,
                  status: 'ACTIVE',
                })
                .select('id, name')
                .single();
              if (newSec) {
                targetSectionId = newSec.id;
              }
            }
          }
        }
      } catch (secErr) {
        console.warn('Resolve section error:', secErr);
      }
    }

    if (!targetClassId) {
      try {
        const { data: cls } = await this.supabase
          .from('classes')
          .select('id, name')
          .eq('school_id', schoolId)
          .limit(1)
          .maybeSingle();
        targetClassId = cls?.id;
        resolvedClassName = cls?.name || 'Class 1';
      } catch {}
    }

    this.setStudentSection(student.id, {
      classId: targetClassId,
      className: resolvedClassName,
      sectionId: targetSectionId || body.sectionId,
      sectionName: resolvedSectionName,
      rollNumber: body.rollNumber ? String(body.rollNumber) : '1',
    });

    if (academicYearId && targetSectionId) {
      try {
        await this.supabase.from('student_enrollments').insert({
          student_id: student.id,
          section_id: targetSectionId,
          academic_year_id: academicYearId,
          roll_number: body.rollNumber ? String(body.rollNumber) : '1',
          status: 'ACTIVE',
        });
      } catch (eErr) {
        console.warn('Direct student_enrollments insert note:', eErr);
      }
    }

    // Provision parent user account & guardian linkage
    await this.ensureParentUserAndGuardian(schoolId, student.id, body);

    return {
      success: true,
      ...student,
      fullName: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
    };
  }

  private async ensureParentUserAndGuardian(schoolId: string, studentId: string, body: any): Promise<void> {
    const guardianEmail = (body.guardianEmail || '').trim().toLowerCase();
    const guardianPhone = (body.guardianPhone || body.emergencyContactPhone || '').trim();
    const guardianName = (body.guardianName || body.emergencyContactName || '').trim();
    const relationship = body.relationship || 'FATHER';

    if (!guardianEmail && !guardianPhone && !guardianName) return;

    const nameParts = (guardianName || 'Parent').split(' ');
    const firstName = nameParts[0] || 'Parent';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      // 1. Check if user already exists
      let parentUserId: string | null = null;
      if (guardianEmail) {
        const { data: existingUser } = await this.supabase
          .from('users')
          .select('id, email, password_hash')
          .eq('email', guardianEmail)
          .maybeSingle();
        if (existingUser) {
          parentUserId = existingUser.id;
        }
      } else if (guardianPhone) {
        const { data: existingUser } = await this.supabase
          .from('users')
          .select('id, phone')
          .eq('phone', guardianPhone)
          .maybeSingle();
        if (existingUser) {
          parentUserId = existingUser.id;
        }
      }

      // 2. If user doesn't exist, insert into users table with default password 'password123'
      if (!parentUserId && (guardianEmail || guardianPhone)) {
        const { data: newUser, error: uErr } = await this.supabase
          .from('users')
          .insert({
            email: guardianEmail || `parent.${Date.now()}@schoolsense.in`,
            phone: guardianPhone || null,
            first_name: firstName,
            last_name: lastName || null,
            password_hash: 'password123',
            status: 'ACTIVE',
          })
          .select()
          .single();

        if (!uErr && newUser) {
          parentUserId = newUser.id;
        }
      }

      if (parentUserId) {
        // 3. Ensure role GUARDIAN exists
        let roleId: string | null = null;
        const { data: roles } = await this.supabase
          .from('roles')
          .select('id, code')
          .in('code', ['GUARDIAN', 'PARENT'])
          .limit(1);

        if (roles && roles.length > 0) {
          roleId = roles[0].id;
        } else {
          const { data: newRole } = await this.supabase
            .from('roles')
            .insert({
              name: 'Guardian / Parent',
              code: 'GUARDIAN',
              description: 'Parent or Legal Guardian of Student',
              is_system_role: true,
              status: 'ACTIVE',
            })
            .select()
            .single();
          roleId = newRole?.id || null;
        }

        // 4. Ensure user_school_roles
        if (roleId) {
          const { data: existingUsr } = await this.supabase
            .from('user_school_roles')
            .select('id')
            .eq('user_id', parentUserId)
            .eq('school_id', schoolId)
            .maybeSingle();

          if (!existingUsr) {
            await this.supabase.from('user_school_roles').insert({
              user_id: parentUserId,
              school_id: schoolId,
              role_id: roleId,
              status: 'ACTIVE',
            });
          }
        }

        // 5. Ensure guardians profile
        let guardianId: string | null = null;
        const { data: existingG } = await this.supabase
          .from('guardians')
          .select('id')
          .eq('school_id', schoolId)
          .eq('user_id', parentUserId)
          .maybeSingle();

        if (existingG) {
          guardianId = existingG.id;
        } else {
          const { data: newG } = await this.supabase
            .from('guardians')
            .insert({
              school_id: schoolId,
              user_id: parentUserId,
              relation: relationship || 'Parent',
              status: 'ACTIVE',
            })
            .select()
            .single();
          guardianId = newG?.id || null;
        }

        // 6. Link in student_guardians
        if (guardianId && studentId) {
          const { data: existingSG } = await this.supabase
            .from('student_guardians')
            .select('id')
            .eq('student_id', studentId)
            .eq('guardian_id', guardianId)
            .maybeSingle();

          if (!existingSG) {
            await this.supabase.from('student_guardians').insert({
              student_id: studentId,
              guardian_id: guardianId,
              relationship: relationship || 'Parent',
              is_primary_contact: true,
              emergency_contact: true,
              can_pickup: true,
            });
          }
        }
      }

      // Also persist in local parent-student mapping cache
      this.saveLocalParentStudentMap(studentId, {
        studentId,
        guardianEmail,
        guardianPhone,
        guardianName,
        relationship,
        schoolId,
        parentUserId,
      });
    } catch (err) {
      console.warn('ensureParentUserAndGuardian background process error:', err);
    }
  }

  // ============================================================================
  // SaaS Subscription & School Wallet Handlers (Hybrid Supabase + LocalStorage Fallback)
  // ============================================================================

  private getLocalSubscriptions(): Record<string, any> {
    try {
      return JSON.parse(localStorage.getItem('schoolsense_saas_subscriptions') || '{}');
    } catch {
      return {};
    }
  }

  private saveLocalSubscription(schoolId: string, data: any) {
    try {
      const subs = this.getLocalSubscriptions();
      subs[schoolId] = { ...(subs[schoolId] || {}), ...data, school_id: schoolId, updated_at: new Date().toISOString() };
      localStorage.setItem('schoolsense_saas_subscriptions', JSON.stringify(subs));
    } catch {}
  }

  private getLocalWallets(): Record<string, any> {
    try {
      return JSON.parse(localStorage.getItem('schoolsense_saas_wallets') || '{}');
    } catch {
      return {};
    }
  }

  private saveLocalWallet(schoolId: string, data: any) {
    try {
      const wallets = this.getLocalWallets();
      wallets[schoolId] = { ...(wallets[schoolId] || {}), ...data, school_id: schoolId, updated_at: new Date().toISOString() };
      localStorage.setItem('schoolsense_saas_wallets', JSON.stringify(wallets));
    } catch {}
  }

  private getLocalWalletTransactions(schoolId: string): any[] {
    try {
      const allTxns = JSON.parse(localStorage.getItem('schoolsense_wallet_txns') || '{}');
      return allTxns[schoolId] || [];
    } catch {
      return [];
    }
  }

  private addLocalWalletTransaction(schoolId: string, txn: any) {
    try {
      const allTxns = JSON.parse(localStorage.getItem('schoolsense_wallet_txns') || '{}');
      if (!allTxns[schoolId]) allTxns[schoolId] = [];
      allTxns[schoolId].unshift(txn);
      localStorage.setItem('schoolsense_wallet_txns', JSON.stringify(allTxns));
    } catch {}
  }

  private async getSubscriptionDetails(targetSchoolId?: string, academicYearId?: string): Promise<any> {
    const schoolId = targetSchoolId || this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');
    const effectiveYearId = academicYearId || (await this.getActiveAcademicYearId(schoolId));

    // 1. Try RPC get_school_subscription_details
    try {
      const { data, error } = await this.supabase.rpc('get_school_subscription_details', {
        p_school_id: schoolId,
        p_academic_year_id: effectiveYearId || null,
      });
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('RPC get_school_subscription_details unavailable, using fallback', e);
    }

    // 2. Direct Query Fallback
    let subData: any = null;
    let walletData: any = null;
    let activeStudents = 0;
    let txnsList: any[] = [];

    try {
      let enrQuery = this.supabase
        .from('student_enrollments')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'INACTIVE');
      if (effectiveYearId) {
        enrQuery = enrQuery.eq('academic_year_id', effectiveYearId);
      }

      const [subRes, walletRes, studentCountRes, txnsRes] = await Promise.all([
        this.supabase.from('school_subscriptions').select('*').eq('school_id', schoolId).maybeSingle() as any,
        this.supabase.from('school_wallets').select('*').eq('school_id', schoolId).maybeSingle() as any,
        enrQuery as any,
        this.supabase.from('wallet_transactions').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(25) as any,
      ]);

      if (subRes?.data) subData = subRes.data;
      if (walletRes?.data) walletData = walletRes.data;
      if (studentCountRes?.count !== undefined && studentCountRes.count !== null) activeStudents = studentCountRes.count;
      if (txnsRes?.data && Array.isArray(txnsRes.data)) txnsList = txnsRes.data;

      // Fallback: If 0 enrollments in DB for base session, check local map & active students
      if (activeStudents === 0 && effectiveYearId) {
        try {
          const { data: activeYears } = await this.supabase
            .from('academic_years')
            .select('id, is_current')
            .eq('school_id', schoolId)
            .eq('is_current', true);
          const isBase = activeYears && activeYears.length > 0 && activeYears[0].id === effectiveYearId;
          if (isBase) {
            const { count: stCount } = await this.supabase
              .from('students')
              .select('id', { count: 'exact', head: true })
              .eq('school_id', schoolId)
              .neq('status', 'INACTIVE');
            activeStudents = stCount || 0;
          }
        } catch {}
      }
    } catch (dbErr) {
      console.warn('Supabase subscription tables direct query failed, falling back to local cache', dbErr);
    }

    // Local Storage Cache Fallback / Merging
    const localSubs = this.getLocalSubscriptions();
    const localWallets = this.getLocalWallets();
    const localTxns = this.getLocalWalletTransactions(schoolId);

    const mergedSub = subData || localSubs[schoolId] || {};
    const mergedWallet = walletData || localWallets[schoolId] || {};
    const mergedTxns = txnsList.length > 0 ? txnsList : localTxns;

    const perStudentFee = Number(mergedSub.per_student_fee ?? mergedSub.perStudentFee) || 20.00;
    const monthlyEst = activeStudents * perStudentFee;

    const subscription = {
      id: mergedSub.id || `sub-${schoolId}`,
      school_id: schoolId,
      per_student_fee: perStudentFee,
      billing_cycle: mergedSub.billing_cycle || 'MONTHLY',
      currency: mergedSub.currency || 'INR',
      status: mergedSub.status || 'ACTIVE',
      next_billing_date: mergedSub.next_billing_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: mergedSub.created_at || new Date().toISOString(),
    };

    const wallet = {
      id: mergedWallet.id || `wallet-${schoolId}`,
      school_id: schoolId,
      balance: Number(mergedWallet.balance) || 0.00,
      credit_limit: Number(mergedWallet.credit_limit) || -5000.00,
      currency: mergedWallet.currency || 'INR',
      status: mergedWallet.status || 'ACTIVE',
    };

    const transactions = mergedTxns.map((t: any) => ({
      id: t.id || `txn-${Date.now()}-${Math.random()}`,
      amount: Number(t.amount) || 0,
      transaction_type: t.transaction_type,
      category: t.category,
      balance_after: Number(t.balance_after) || 0,
      reference_id: t.reference_id,
      description: t.description,
      student_count: t.student_count || 0,
      payment_method: t.payment_method || 'MANUAL',
      created_at: t.created_at || new Date().toISOString(),
    }));

    return {
      subscription,
      wallet,
      stats: {
        active_students: activeStudents,
        estimated_monthly_fee: monthlyEst,
      },
      transactions,
    };
  }

  private async topUpWallet(body: any): Promise<any> {
    const schoolId = body.schoolId || this.getSchoolId();
    const amount = Number(body.amount);
    if (!schoolId) throw new Error('School context missing');
    if (isNaN(amount) || amount === 0) throw new Error('Transaction amount cannot be zero');

    // 1. If positive top-up, try RPC top_up_school_wallet
    if (amount > 0 && body.method !== 'SUPER_ADMIN_ADJUSTMENT') {
      try {
        const { data, error } = await this.supabase.rpc('top_up_school_wallet', {
          p_school_id: schoolId,
          p_amount: amount,
          p_method: body.method || 'MANUAL_SIMULATED',
          p_notes: body.notes || 'School Administrator Top-Up',
          p_performed_by_id: this.getUserId() || null,
        });
        if (!error && data) return data;
      } catch (e) {
        console.warn('RPC top_up_school_wallet error, falling back', e);
      }
    }

    // 2. Direct Fallback with Local Cache Support (Handles both Credit and Debit)
    let oldBalance = 0;
    const localWallets = this.getLocalWallets();
    if (localWallets[schoolId]?.balance !== undefined) {
      oldBalance = Number(localWallets[schoolId].balance) || 0;
    }

    try {
      const { data: currWallet } = await this.supabase
        .from('school_wallets')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();

      if (currWallet) {
        oldBalance = Number(currWallet.balance) || 0;
      }
    } catch {}

    const newBalance = oldBalance + amount;
    const isCredit = amount > 0;
    const refPrefix = isCredit ? 'CR' : 'DR';
    const refId = `${refPrefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const txnRecord = {
      id: `txn-${Date.now()}`,
      school_id: schoolId,
      amount: amount,
      transaction_type: isCredit ? 'CREDIT' : 'DEBIT',
      category: body.category || (body.method === 'SUPER_ADMIN_ADJUSTMENT' ? 'ADMIN_ADJUSTMENT' : (isCredit ? 'TOP_UP' : 'ADMIN_DEBIT')),
      balance_after: newBalance,
      reference_id: refId,
      description: body.notes || (isCredit ? 'School Administrator Top-Up' : 'Root Administrator Balance Adjustment'),
      payment_method: body.method || 'MANUAL',
      performed_by_id: this.getUserId() || null,
      created_at: new Date().toISOString(),
    };

    // Save in LocalStorage Cache
    this.saveLocalWallet(schoolId, { balance: newBalance });
    this.addLocalWalletTransaction(schoolId, txnRecord);

    // Attempt Supabase Persistence
    try {
      const { data: currWallet } = await this.supabase
        .from('school_wallets')
        .select('id')
        .eq('school_id', schoolId)
        .maybeSingle();

      if (currWallet) {
        await this.supabase.from('school_wallets').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', currWallet.id);
      } else {
        await this.supabase.from('school_wallets').insert({ school_id: schoolId, balance: newBalance });
      }

      await this.supabase.from('wallet_transactions').insert(txnRecord);
    } catch (dbErr) {
      console.warn('Supabase direct DB update failed for wallet adjustment, cached locally', dbErr);
    }

    return {
      success: true,
      reference_id: refId,
      amount,
      old_balance: oldBalance,
      new_balance: newBalance,
    };
  }

  private async calculateMonthlySubscription(targetSchoolId?: string, academicYearId?: string): Promise<any> {
    const schoolId = targetSchoolId || this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');
    const effectiveYearId = academicYearId || (await this.getActiveAcademicYearId(schoolId));

    // 1. Try RPC
    try {
      const { data, error } = await this.supabase.rpc('calculate_monthly_subscription', {
        p_school_id: schoolId,
        p_academic_year_id: effectiveYearId || null,
      });
      if (!error && data) return data;
    } catch (e) {
      console.warn('RPC calculate_monthly_subscription error, falling back', e);
    }

    // 2. Direct Fallback
    const localSubs = this.getLocalSubscriptions();
    let rate = Number(localSubs[schoolId]?.per_student_fee) || 20.00;

    try {
      const { data: sub } = await this.supabase
        .from('school_subscriptions')
        .select('per_student_fee')
        .eq('school_id', schoolId)
        .maybeSingle();
      if (sub?.per_student_fee) rate = Number(sub.per_student_fee);
    } catch {}

    let enrollments: any[] = [];
    if (effectiveYearId) {
      try {
        const { data: enrollData } = await this.supabase
          .from('student_enrollments')
          .select('*, student:students(*), section:sections(*, class:classes(*))')
          .eq('academic_year_id', effectiveYearId)
          .neq('status', 'INACTIVE');
        if (enrollData && enrollData.length > 0) {
          enrollments = enrollData;
        }
      } catch (e) {
        console.warn('Query student_enrollments in calculateMonthlySubscription failed:', e);
      }
    }

    // Fallback for base session if enrollments not yet created in DB
    if (enrollments.length === 0 && effectiveYearId) {
      try {
        const { data: activeYears } = await this.supabase
          .from('academic_years')
          .select('id, is_current')
          .eq('school_id', schoolId)
          .eq('is_current', true);
        const isBase = activeYears && activeYears.length > 0 && activeYears[0].id === effectiveYearId;
        if (isBase) {
          const secMap = this.getStudentSectionMap();
          const { data: students } = await this.supabase
            .from('students')
            .select('*')
            .eq('school_id', schoolId)
            .neq('status', 'INACTIVE');

          enrollments = (students || []).map((st: any) => {
            const mapped = secMap[st.id];
            return {
              id: st.id,
              student_id: st.id,
              student: st,
              created_at: st.created_at,
              section: {
                name: mapped?.sectionName || 'Section A',
                class: { name: mapped?.className || 'Class 1' },
              },
            };
          });
        }
      } catch {}
    }

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalCalculatedFee = 0;
    const breakdown = (enrollments || [])
      .filter((e: any) => e.student)
      .map((e: any) => {
        const st = e.student || {};
        const enDate = new Date(e.created_at || st.created_at || now);
        const className = e.section?.class?.name || e.class?.name || 'Class 1';
        const sectionName = e.section?.name || 'Section A';

        let studentFee = rate;
        let billingNote = 'Full Month (Enrolled on/before 1st)';

        if (enDate > firstDay) {
          const daysActive = daysInMonth - enDate.getDate() + 1;
          if (daysActive < 7) {
            studentFee = Number(((rate * daysActive) / daysInMonth).toFixed(2));
            billingNote = `Prorated (${daysActive} days active in cycle)`;
          } else {
            billingNote = 'Full Month (Mid-month enrollment)';
          }
        }

        totalCalculatedFee += studentFee;

        return {
          student_id: st.id,
          admission_number: st.admission_number || '',
          student_name: `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.admission_number || 'Student',
          enrollment_date: (e.created_at || st.created_at)?.split('T')[0] || now.toISOString().split('T')[0],
          status: e.status || st.status || 'ACTIVE',
          class_name: className,
          section_name: sectionName,
          student_fee: studentFee,
          billing_note: billingNote,
        };
      });

    return {
      school_id: schoolId,
      academic_year_id: effectiveYearId,
      per_student_rate: rate,
      total_students: breakdown.length,
      total_calculated_fee: Number(totalCalculatedFee.toFixed(2)),
      billing_cycle: 'MONTHLY',
      cycle_month: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      students_breakdown: breakdown,
    };
  }

  private async executeMonthlyBilling(body: any): Promise<any> {
    const schoolId = body.schoolId || this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    // 1. Try RPC
    try {
      const { data, error } = await this.supabase.rpc('execute_monthly_subscription_billing', {
        p_school_id: schoolId,
        p_performed_by_id: this.getUserId() || null,
      });
      if (!error && data) return data;
    } catch (e) {
      console.warn('RPC execute_monthly_subscription_billing error, falling back', e);
    }

    // 2. Direct Fallback
    const calc = await this.calculateMonthlySubscription(schoolId);
    const fee = calc.total_calculated_fee;
    const studentCount = calc.total_students;

    if (fee <= 0 && studentCount === 0) {
      return { success: true, message: 'No active students to bill.', amount_debited: 0 };
    }

    let oldBalance = 0;
    const localWallets = this.getLocalWallets();
    if (localWallets[schoolId]?.balance !== undefined) {
      oldBalance = Number(localWallets[schoolId].balance) || 0;
    }

    try {
      const { data: currWallet } = await this.supabase
        .from('school_wallets')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();

      if (currWallet) {
        oldBalance = Number(currWallet.balance) || 0;
      }
    } catch {}

    const newBalance = oldBalance - fee;
    const refId = `SUB-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const txnRecord = {
      id: `txn-${Date.now()}`,
      school_id: schoolId,
      amount: -fee,
      transaction_type: 'DEBIT',
      category: 'SUBSCRIPTION_FEE',
      balance_after: newBalance,
      reference_id: refId,
      description: `SaaS Subscription for ${calc.cycle_month} (${studentCount} Students @ ₹${calc.per_student_rate}/mo)`,
      student_count: studentCount,
      payment_method: 'AUTOMATED_WALLET_DEBIT',
      performed_by_id: this.getUserId() || null,
      created_at: new Date().toISOString(),
    };

    // Save in LocalStorage Cache
    this.saveLocalWallet(schoolId, { balance: newBalance });
    this.addLocalWalletTransaction(schoolId, txnRecord);

    // Save in Supabase
    try {
      const { data: currWallet } = await this.supabase
        .from('school_wallets')
        .select('id')
        .eq('school_id', schoolId)
        .maybeSingle();

      if (currWallet) {
        await this.supabase.from('school_wallets').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', currWallet.id);
      } else {
        await this.supabase.from('school_wallets').insert({ school_id: schoolId, balance: newBalance });
      }

      await this.supabase.from('wallet_transactions').insert(txnRecord);
      await this.supabase.from('school_subscriptions').update({
        last_billed_date: new Date().toISOString().split('T')[0],
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      }).eq('school_id', schoolId);
    } catch (dbErr) {
      console.warn('Supabase monthly billing direct execution failed, cached locally', dbErr);
    }

    return {
      success: true,
      reference_id: refId,
      amount_debited: fee,
      student_count: studentCount,
      old_balance: oldBalance,
      new_balance: newBalance,
      cycle_month: calc.cycle_month,
    };
  }

  private async updateSubscriptionRate(body: any): Promise<any> {
    const schoolId = body.schoolId;
    const rate = Number(body.perStudentFee);
    const adjustment = Number(body.walletAdjustment || 0);
    const reason = body.reason || 'Super Admin Rate Adjustment';

    if (!schoolId) throw new Error('School ID is required');
    if (isNaN(rate) || rate <= 0) throw new Error('Per-student fee must be greater than zero');

    // 1. Save immediately in LocalStorage Cache so UI is guaranteed instant reactivity
    this.saveLocalSubscription(schoolId, { per_student_fee: rate });

    // 2. Try RPC
    try {
      const { data, error } = await this.supabase.rpc('update_school_subscription_rate', {
        p_school_id: schoolId,
        p_per_student_fee: rate,
        p_wallet_adjustment: adjustment,
        p_adjustment_reason: reason,
        p_performed_by_id: this.getUserId() || null,
      });
      if (!error && data) {
        // Also sync local cache with the adjustment
        if (adjustment !== 0) {
          const localWallets = this.getLocalWallets();
          const currBal = Number(localWallets[schoolId]?.balance || 0);
          const newBal = currBal + adjustment;
          this.saveLocalWallet(schoolId, { balance: newBal });
          const isCredit = adjustment > 0;
          this.addLocalWalletTransaction(schoolId, {
            id: `txn-${Date.now()}`,
            school_id: schoolId,
            amount: adjustment,
            transaction_type: isCredit ? 'CREDIT' : 'DEBIT',
            category: 'ADMIN_ADJUSTMENT',
            balance_after: newBal,
            reference_id: (isCredit ? 'CR-' : 'DR-') + Date.now(),
            description: `Root Admin: ${reason}`,
            payment_method: 'SUPER_ADMIN',
            performed_by_id: this.getUserId() || null,
            created_at: new Date().toISOString(),
          });
        }
        return data;
      }
    } catch (e) {
      console.warn('RPC update_school_subscription_rate error, falling back', e);
    }

    // 3. Direct Fallback to Supabase (wrapped safely)
    try {
      const { data: sub } = await this.supabase
        .from('school_subscriptions')
        .select('id')
        .eq('school_id', schoolId)
        .maybeSingle();

      if (sub) {
        await this.supabase.from('school_subscriptions').update({ per_student_fee: rate, updated_at: new Date().toISOString() }).eq('id', sub.id);
      } else {
        await this.supabase.from('school_subscriptions').insert({ school_id: schoolId, per_student_fee: rate });
      }
    } catch (dbErr) {
      console.warn('Direct Supabase school_subscriptions update failed, stored in localStorage', dbErr);
    }

    if (adjustment !== 0) {
      try {
        await this.topUpWallet({
          schoolId,
          amount: adjustment,
          method: 'SUPER_ADMIN_ADJUSTMENT',
          category: 'ADMIN_ADJUSTMENT',
          notes: `Root Admin: ${reason}`,
        });
      } catch (adjErr) {
        console.warn('Wallet adjustment error, recorded locally', adjErr);
      }
    }

    return {
      success: true,
      school_id: schoolId,
      new_rate: rate,
      adjustment_applied: adjustment,
    };
  }
}
