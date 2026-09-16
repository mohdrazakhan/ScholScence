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
  StudentLifecycleLog,
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

    // School Profile
    if (cleanEndpoint === 'school/profile' || cleanEndpoint === 'academics/school-profile') {
      const targetSchoolId = params?.['schoolId'] || this.getSchoolId();
      return from(this.getSchoolProfile(targetSchoolId)) as unknown as Observable<T>;
    }

    // Role Permissions & Module Matrix
    if (cleanEndpoint === 'school/role-permissions' || cleanEndpoint === 'academics/role-permissions') {
      const targetSchoolId = params?.['schoolId'] || this.getSchoolId();
      return from(this.getRolePermissions(targetSchoolId)) as unknown as Observable<T>;
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

    // Academics: Next Unique Admission Number
    if (cleanEndpoint === 'academics/students/next-admission-number' || cleanEndpoint === 'students/next-admission-number') {
      return from(this.getNextAdmissionNumber(params?.['schoolId'])) as unknown as Observable<T>;
    }

    // Academics: Student Academic & Deactivation Requests
    if (
      cleanEndpoint === 'academics/students/deactivation-requests' ||
      cleanEndpoint === 'students/deactivation-requests' ||
      cleanEndpoint === 'academics/students/academic-requests' ||
      cleanEndpoint === 'students/academic-requests'
    ) {
      return from(this.getStudentDeactivationRequests()) as unknown as Observable<T>;
    }

    // Academics: Student Full Profile & Timeline Logs
    const studentProfileMatch = cleanEndpoint.match(/^(?:academics\/)?students\/([^\/]+)(?:\/profile)?$/);
    if (
      studentProfileMatch &&
      studentProfileMatch[1] !== 'next-admission-number' &&
      studentProfileMatch[1] !== 'deactivation-requests' &&
      studentProfileMatch[1] !== 'academic-requests' &&
      !cleanEndpoint.includes('deactivation-requests') &&
      !cleanEndpoint.includes('academic-requests')
    ) {
      return from(this.getStudentFullProfile(studentProfileMatch[1])) as unknown as Observable<T>;
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
      return from(this.getAlumniStudents(params?.['academicYearId'])) as unknown as Observable<T>;
    }

    // Academics: Student Lifecycle Journey & Logs
    const studentLogsMatch = cleanEndpoint.match(/^academics\/students\/(.+)\/lifecycle-logs$/) || cleanEndpoint.match(/^academics\/alumni\/(.+)\/logs$/);
    if (studentLogsMatch) {
      return from(this.getStudentLifecycleLogs(studentLogsMatch[1])) as unknown as Observable<T>;
    }

    // Academics: Subjects
    if (cleanEndpoint === 'academics/subjects' || cleanEndpoint.match(/^academics\/classes\/.*\/subjects$/)) {
      return from(this.getSubjects()) as unknown as Observable<T>;
    }

    // Academics: Staff
    if (cleanEndpoint === 'academics/staff' || cleanEndpoint === 'complaints/faculty') {
      return from(this.getStaff()) as unknown as Observable<T>;
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
      return from(this.getExams(params?.['academicYearId'])) as unknown as Observable<T>;
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

    // Academic Sessions & Rollover & Full Reset
    if (cleanEndpoint === 'academics/reset-all' || cleanEndpoint === 'academics/reset-database') {
      return from(this.resetAllStudentsAndSessions()) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'academics/sessions' || cleanEndpoint === 'academic-years') {
      return from(this.createAcademicSession(body)) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'academics/sessions/rollover' || cleanEndpoint === 'academic-years/rollover') {
      return from(this.rolloverStudents(body)) as unknown as Observable<T>;
    }

    // Alumni Student Creation
    if (cleanEndpoint === 'academics/alumni') {
      return from(this.createAlumniStudent(body)) as unknown as Observable<T>;
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

    // Student Promotion, Demotion, Section Change & Alumni Direct Actions
    if (cleanEndpoint === 'academics/students/promote') {
      return from(this.promoteStudent(body)) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'academics/students/demote') {
      return from(this.demoteStudent(body)) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'academics/students/change-section' || cleanEndpoint === 'academics/students/transfer-section') {
      return from(this.changeStudentSection(body)) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'academics/students/convert-alumni' || cleanEndpoint === 'academics/students/graduate') {
      return from(this.convertStudentToAlumni(body)) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'academics/alumni/certificates' || cleanEndpoint === 'academics/students/certificates') {
      return from(this.recordStudentCertificate(body)) as unknown as Observable<T>;
    }

    // Student Academic / Deactivation Request
    if (
      cleanEndpoint === 'academics/students/deactivation-requests' ||
      cleanEndpoint === 'students/deactivation-requests' ||
      cleanEndpoint === 'academics/students/academic-requests' ||
      cleanEndpoint === 'students/academic-requests'
    ) {
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

    // Alumni Update
    const alumniMatch = cleanEndpoint.match(/^academics\/alumni\/([^/]+)$/);
    if (alumniMatch) {
      return from(this.updateAlumniStudent(alumniMatch[1], body)) as unknown as Observable<T>;
    }

    // Student Update (Edit details)
    const studentMatch = cleanEndpoint.match(/^academics\/students\/([^/]+)$/);
    if (studentMatch && !cleanEndpoint.includes('deactivation-requests')) {
      return from(this.updateStudent(studentMatch[1], body)) as unknown as Observable<T>;
    }

    // Review Student Deactivation / Academic Request (Admin / Principal)
    const deactReviewMatch = cleanEndpoint.match(/^academics\/students\/(?:deactivation-requests|academic-requests)\/(.+)\/review$/);
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

    if (cleanEndpoint === 'school/profile' || cleanEndpoint === 'academics/school-profile') {
      const targetSchoolId = body?.schoolId || body?.id || this.getSchoolId();
      return from(this.updateSchoolProfile(targetSchoolId, body)) as unknown as Observable<T>;
    }

    if (cleanEndpoint === 'school/role-permissions' || cleanEndpoint === 'academics/role-permissions') {
      const targetSchoolId = body?.schoolId || this.getSchoolId();
      return from(this.updateRolePermissions(targetSchoolId, body?.permissions || body)) as unknown as Observable<T>;
    }

    return this.patch<T>(endpoint, body);
  }

  delete<T>(endpoint: string): Observable<T> {
    const cleanEndpoint = endpoint.split('?')[0];

    if (cleanEndpoint.startsWith('academics/alumni/')) {
      const id = cleanEndpoint.replace('academics/alumni/', '');
      return from(this.deleteAlumniStudent(id)) as unknown as Observable<T>;
    }

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
    if (!schoolId) {
      return {
        stats: {
          totalStudents: 0,
          activeStudents: 0,
          inactiveStudents: 0,
          totalClasses: 0,
          totalTeachers: 0,
          attendanceTodayPercentage: '0.0',
          attendanceMarkedCount: 0,
          pendingComplaints: 0,
        },
        recentNotices: [],
        upcomingExams: [],
      };
    }

    const effectiveYearId = academicYearId || (await this.getActiveAcademicYearId(schoolId));

    let activeStudentCount = 0;
    let inactiveStudentCount = 0;
    let totalStudentCount = 0;
    let classCount = 0;
    let teacherCount = 0;
    let complaintsCount = 0;

    const localStatusMap = (() => {
      try {
        return JSON.parse(localStorage.getItem('schoolsense_student_statuses') || '{}');
      } catch {
        return {};
      }
    })();

    const [cRes, staffList, compRes] = await Promise.all([
      this.supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', schoolId) as any,
      this.getStaff(),
      this.supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'OPEN') as any,
    ]);

    classCount = cRes.count || 0;
    teacherCount = (staffList || []).length;
    complaintsCount = compRes.count || 0;

    if (effectiveYearId) {
      // 1. Query enrollments strictly for this selected academic session
      try {
        const { data: enrData } = await this.supabase
          .from('student_enrollments')
          .select('id, status, student_id, student:students(id, status)')
          .eq('academic_year_id', effectiveYearId);

        const enrollments = (enrData || []).filter((e: any) => !!e.student);

        if (enrollments.length > 0) {
          enrollments.forEach((e: any) => {
            const rawStatus = localStatusMap[e.student_id]?.status || localStatusMap[e.id]?.status || e.status || e.student?.status || 'ACTIVE';
            const stStatus = String(rawStatus).toUpperCase();
            if (stStatus === 'INACTIVE' || stStatus === 'LEFTOUT') {
              inactiveStudentCount++;
            } else {
              activeStudentCount++;
            }
          });
          totalStudentCount = activeStudentCount + inactiveStudentCount;
        }
      } catch (e) {
        console.warn('Dashboard enrollments query note:', e);
      }

      // 2. Fallback only if 0 total enrollments exist in the entire database (first-time onboarding before sessions)
      if (totalStudentCount === 0) {
        try {
          const { count: globalEnrCount } = await this.supabase
            .from('student_enrollments')
            .select('id', { count: 'exact', head: true });

          if (!globalEnrCount || globalEnrCount === 0) {
            const { data: allStudents } = await this.supabase
              .from('students')
              .select('id, status')
              .eq('school_id', schoolId)
              .neq('status', 'ALUMNI');

            if (allStudents && allStudents.length > 0) {
              allStudents.forEach((st: any) => {
                const rawStatus = localStatusMap[st.id]?.status || st.status || 'ACTIVE';
                const stStatus = String(rawStatus).toUpperCase();
                if (stStatus === 'INACTIVE' || stStatus === 'LEFTOUT') {
                  inactiveStudentCount++;
                } else {
                  activeStudentCount++;
                }
              });
              totalStudentCount = activeStudentCount + inactiveStudentCount;
            }
          }
        } catch {}
      }
    }

    // Today's attendance percentage calculation for this session
    let attendancePercentage = '0.0';
    let attendanceMarkedCount = 0;
    if (effectiveYearId && totalStudentCount > 0) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: attRecords } = await this.supabase
          .from('attendance')
          .select('id, status')
          .eq('school_id', schoolId)
          .eq('date', today);

        if (attRecords && attRecords.length > 0) {
          attendanceMarkedCount = attRecords.length;
          const presentCount = attRecords.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
          attendancePercentage = ((presentCount / totalStudentCount) * 100).toFixed(1);
        }
      } catch {}
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
        totalStudents: totalStudentCount,
        activeStudents: activeStudentCount,
        inactiveStudents: inactiveStudentCount,
        totalClasses: classCount,
        totalTeachers: teacherCount,
        attendanceTodayPercentage: attendancePercentage,
        attendanceMarkedCount: attendanceMarkedCount,
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
        // Only auto-provision on brand new empty database (0 total enrollments in school)
        if (totalEnrCount && totalEnrCount > 0) {
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
          } else if (existing?.className || existing?.classId) {
            const matchedCls = allSections.filter(
              (s) => (existing.classId && s.classId === existing.classId) ||
                     (existing.className && s.className.toLowerCase() === existing.className.toLowerCase())
            );
            targetSec = matchedCls.find(
              (s) => s.name.toLowerCase() === (existing.sectionName || 'section a').toLowerCase()
            ) || matchedCls[0] || allSections[0];
            rollNo = String(existing.rollNumber || '1');
          } else {
            const secIndex = i % allSections.length;
            targetSec = allSections[secIndex];
            rollNo = String(Math.floor(i / allSections.length) + 1);
          }

          enrollmentsToInsert.push({
            student_id: st.id,
            section_id: targetSec.id,
            class_id: targetSec.classId,
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
      let enrollQuery = this.supabase
        .from('student_enrollments')
        .select('id, section_id, status, section:sections(id, name, class_id)');
      if (effectiveYearId) {
        enrollQuery = enrollQuery.eq('academic_year_id', effectiveYearId);
      }
      const { data: enrollData } = await enrollQuery;
      (enrollData || []).forEach((e: any) => {
        if (e.status !== 'INACTIVE') {
          // Direct section_id match
          const directMatch = sectionsData.find((s: any) => s.id === e.section_id);
          if (directMatch) {
            sectionEnrollmentCounts[directMatch.id] = (sectionEnrollmentCounts[directMatch.id] || 0) + 1;
          } else {
            // Match by class_id and section name
            const classMatch =
              sectionsData.find(
                (s: any) =>
                  s.class_id === e.section?.class_id &&
                  (s.name?.trim().toLowerCase() === (e.section?.name || 'section a').trim().toLowerCase() || !e.section?.name)
              ) || sectionsData.find((s: any) => s.class_id === e.section?.class_id);
            if (classMatch) {
              sectionEnrollmentCounts[classMatch.id] = (sectionEnrollmentCounts[classMatch.id] || 0) + 1;
            }
          }
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
            const sec = sectionsData.find(
              (s: any) =>
                s.id === info.sectionId ||
                (s.class_id === info.classId && (s.name || '').toLowerCase() === (info.sectionName || 'section a').toLowerCase())
            ) || sectionsData.find((s: any) => s.class_id === info.classId);

            if (sec) {
              sectionEnrollmentCounts[sec.id] = (sectionEnrollmentCounts[sec.id] || 0) + 1;
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
        this.supabase.from('subject_teachers').select('subject_id, section_id').then((res) => res, () => ({ data: [], error: null })),
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
      // 1. Fetch user_school_roles, users, roles, sections, subject teachers, classes, and guardians
      const [usrRes, usersRes, rolesRes, sectionsRes, subjectTeachersRes, classesRes, subjectsRes, guardiansRes] = await Promise.all([
        this.supabase.from('user_school_roles').select('*').eq('school_id', schoolId),
        this.supabase.from('users').select('*'),
        this.supabase.from('roles').select('*'),
        this.supabase.from('sections').select('id, name, class_id').eq('school_id', schoolId),
        this.supabase.from('subject_teachers').select('*').then((res) => res, () => ({ data: [], error: null })),
        this.supabase.from('classes').select('id, name').eq('school_id', schoolId),
        this.supabase.from('subjects').select('id, name, code').eq('school_id', schoolId),
        this.supabase.from('guardians').select('id, user_id, school_id').eq('school_id', schoolId),
      ]);

      const userMap = new Map((usersRes.data || []).map((u: any) => [u.id, u]));
      const roleMap = new Map((rolesRes.data || []).map((r: any) => [r.id, r]));
      const classMap = new Map((classesRes.data || []).map((c: any) => [c.id, c]));
      const subjectMap = new Map((subjectsRes.data || []).map((s: any) => [s.id, s]));
      const sectionMap = new Map((sectionsRes.data || []).map((s: any) => [s.id, s]));
      const guardianUserIdSet = new Set((guardiansRes.data || []).map((g: any) => g.user_id));

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

      const guardianRole = (rolesRes.data || []).find((ro: any) => ro.code === 'GUARDIAN' || ro.code === 'PARENT');

      const usrList = usrRes.data || [];
      for (const usr of usrList) {
        const u = userMap.get(usr.user_id);
        if (!u) continue;
        const r = roleMap.get(usr.role_id);
        const roleCode = (r?.code || '').toUpperCase();

        // Strictly exclude Guardians, Parents, Students, and Super Admin from Faculty & Staff directory
        if (
          roleCode === 'GUARDIAN' ||
          roleCode === 'PARENT' ||
          roleCode === 'STUDENT' ||
          roleCode === 'SUPER_ADMIN' ||
          guardianUserIdSet.has(u.id)
        ) {
          // If a guardian was mistakenly assigned a non-guardian role, repair their role in background
          if (guardianUserIdSet.has(u.id) && roleCode !== 'GUARDIAN' && roleCode !== 'PARENT' && guardianRole) {
            (async () => {
              try {
                await this.supabase
                  .from('user_school_roles')
                  .update({ role_id: guardianRole.id })
                  .eq('id', usr.id);
              } catch {}
            })();
          }
          continue;
        }

        if (u.email?.toLowerCase() === 'admin@schoolscence.in' || u.id === '00000000-0000-0000-0000-000000000001') continue;

        const effectiveRoleCode = roleCode || 'TEACHER';
        if (
          effectiveRoleCode !== 'SCHOOL_ADMIN' &&
          effectiveRoleCode !== 'PRINCIPAL' &&
          effectiveRoleCode !== 'TEACHER' &&
          effectiveRoleCode !== 'CLASS_TEACHER' &&
          effectiveRoleCode !== 'STAFF'
        ) {
          continue;
        }

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
          photoUrl: u.photo_url || u.avatar_url || '',
          avatarUrl: u.avatar_url || u.photo_url || '',
          role: roleCode,
          roleName: r?.name || (roleCode === 'SCHOOL_ADMIN' ? 'School Admin' : (roleCode === 'PRINCIPAL' ? 'Principal' : 'Teacher')),
          classTeacherSections: cts,
          subjectAssignments: stAssignments,
          status: usr.status || u.status || 'ACTIVE',
          createdAt: usr.created_at || u.created_at,
        });
      }

      // Self-healing: Find any staff/admin users specifically belonging to this school's domain
      const { data: schoolData } = await this.supabase.from('schools').select('code, email, name').eq('id', schoolId).maybeSingle();
      const schoolDomain = (schoolData?.email && schoolData.email.includes('@')) ? schoolData.email.split('@')[1].toLowerCase().trim() : '';

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

    const photo = body.photoUrl || body.avatarUrl || body.photo_url || null;

    // 1. Create or update User in `users` table
    let userId: string | null = null;
    try {
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('id, email, first_name, last_name, avatar_url, photo_url')
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
            avatar_url: photo || existingUser.avatar_url,
            photo_url: photo || existingUser.photo_url,
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
            avatar_url: photo,
            photo_url: photo,
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

  /**
   * Calculates the active duration (in hours) of a student during the current billing month.
   * If a student was active for >= 72 hours (3 days) in the month, they are marked billable.
   */
  public getStudentActiveTimeInfo(studentId: string, createdAt?: string, status?: string): {
    activeHours: number;
    activeTimeFormatted: string;
    isBillable: boolean;
    activeDays: number;
  } {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const localStatusMap = (() => {
      try {
        return JSON.parse(localStorage.getItem('schoolsense_student_statuses') || '{}');
      } catch {
        return {};
      }
    })();

    const record = localStatusMap[studentId] || {};
    const resolvedStatus = (record.status || status || 'ACTIVE').toUpperCase();
    
    // Authoritative enrollment date: prioritize createdAt passed from student/enrollment DB record, then cache, then month start
    const createdDate = new Date(createdAt || record.created_at || currentMonthStart);
    const effectiveStart = createdDate > currentMonthStart ? createdDate : currentMonthStart;

    let accumulatedMs = Number(record.accumulatedActiveMs) || 0;
    const lastActiveStart = record.lastActiveStartTime ? new Date(record.lastActiveStartTime) : null;
    const deactivationTime = record.updated_at ? new Date(record.updated_at) : null;

    if (resolvedStatus === 'ACTIVE' || resolvedStatus === 'SUSPENDED') {
      if (lastActiveStart) {
        // Student had prior inactive periods and resumed at lastActiveStart
        const activeFrom = lastActiveStart > effectiveStart ? lastActiveStart : effectiveStart;
        accumulatedMs += Math.max(0, now.getTime() - activeFrom.getTime());
      } else {
        // Student has been active/enrolled continuously since effectiveStart
        if (accumulatedMs === 0) {
          accumulatedMs = Math.max(0, now.getTime() - effectiveStart.getTime());
        }
      }
    } else {
      // If student is INACTIVE / LEFTOUT / TRANSFERRED
      if (accumulatedMs === 0) {
        if (deactivationTime && deactivationTime > effectiveStart) {
          accumulatedMs = Math.max(0, deactivationTime.getTime() - effectiveStart.getTime());
        }
      }
    }

    const activeHours = Number((accumulatedMs / (1000 * 60 * 60)).toFixed(1));
    const activeDays = Number((activeHours / 24).toFixed(1));
    const isExceeded72Hours = activeHours >= 72; // 3 days

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemainingFromEnrollment = (createdDate > currentMonthStart)
      ? Math.max(0, daysInMonth - createdDate.getDate() + 1)
      : daysInMonth;

    // Fair 3-Day (72 Hours) Billing Rule:
    // ACTIVE / SUSPENDED (disciplinary hold) students enrolled with >= 3 days in cycle, or any student >= 72h active time
    const isEnrolledAndActive = resolvedStatus === 'ACTIVE' || resolvedStatus === 'SUSPENDED';
    const isBillable = isExceeded72Hours || (isEnrolledAndActive && daysRemainingFromEnrollment >= 3);

    let activeTimeFormatted = '';
    if (activeHours >= 72) {
      activeTimeFormatted = `${activeHours}h (${activeDays}d)`;
    } else if (activeHours >= 24) {
      activeTimeFormatted = `${activeHours}h (${activeDays}d)`;
    } else {
      activeTimeFormatted = `${activeHours}h`;
    }

    return {
      activeHours,
      activeDays,
      activeTimeFormatted,
      isBillable,
    };
  }

  public async updateStudentStatus(studentId: string, status: string, reason?: string): Promise<any> {
    const schoolId = this.getSchoolId();
    const cleanStatus = (status || 'ACTIVE').toUpperCase();
    const now = new Date();
    const nowIso = now.toISOString();

    try {
      let query = this.supabase
        .from('students')
        .update({ status: cleanStatus, updated_at: nowIso })
        .eq('id', studentId);
      if (schoolId) query = query.eq('school_id', schoolId);
      await query;
    } catch (e) {
      console.warn('Failed to update students table status:', e);
    }

    try {
      await this.supabase
        .from('student_enrollments')
        .update({ status: cleanStatus, updated_at: nowIso })
        .eq('student_id', studentId);
    } catch (e) {
      console.warn('Failed to update student_enrollments status:', e);
    }

    // Save in local cache overrides for seamless sync with active duration tracking
    try {
      const raw = localStorage.getItem('schoolsense_student_statuses') || '{}';
      const map = JSON.parse(raw);
      const prev = map[studentId] || {};
      const prevStatus = (prev.status || 'ACTIVE').toUpperCase();

      // Retrieve student created_at from DB if not in cache
      let studentCreatedAt = prev.created_at || null;
      if (!studentCreatedAt) {
        try {
          const { data: stData } = await this.supabase
            .from('students')
            .select('created_at')
            .eq('id', studentId)
            .maybeSingle();
          if (stData?.created_at) studentCreatedAt = stData.created_at;
        } catch {}
      }
      if (!studentCreatedAt) {
        studentCreatedAt = nowIso;
      }

      let accumulatedActiveMs = Number(prev.accumulatedActiveMs) || 0;
      let lastActiveStartTime = prev.lastActiveStartTime || null;

      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const studentCreatedDate = new Date(studentCreatedAt);
      const effectiveStart = studentCreatedDate > currentMonthStart ? studentCreatedDate : currentMonthStart;

      const isPrevActive = prevStatus === 'ACTIVE' || prevStatus === 'SUSPENDED';
      const isNewActive = cleanStatus === 'ACTIVE' || cleanStatus === 'SUSPENDED';

      if (isPrevActive && !isNewActive) {
        // Transitioning from ACTIVE/SUSPENDED to INACTIVE/LEFTOUT: calculate active duration
        const activeSince = lastActiveStartTime ? new Date(lastActiveStartTime) : effectiveStart;
        const validActiveSince = activeSince > effectiveStart ? activeSince : effectiveStart;
        const elapsed = Math.max(0, now.getTime() - validActiveSince.getTime());
        accumulatedActiveMs += elapsed;
        lastActiveStartTime = null;
      } else if (!isPrevActive && isNewActive) {
        // Transitioning back to ACTIVE/SUSPENDED: start recording new active period
        lastActiveStartTime = nowIso;
      }

      const statusHistory = Array.isArray(prev.status_history) ? [...prev.status_history] : [];
      if (prevStatus !== cleanStatus) {
        statusHistory.unshift({
          from_status: prevStatus,
          status: cleanStatus,
          reason: reason || '',
          timestamp: nowIso,
        });
      }

      map[studentId] = {
        status: cleanStatus,
        reason: reason || '',
        updated_at: nowIso,
        created_at: studentCreatedAt,
        accumulatedActiveMs,
        lastActiveStartTime,
        status_history: statusHistory,
      };
      localStorage.setItem('schoolsense_student_statuses', JSON.stringify(map));
    } catch {}

    return { success: true, status: cleanStatus, message: `Student status updated to ${cleanStatus}` };
  }

  public async getStudentFullProfile(studentId: string): Promise<any> {
    const schoolId = this.getSchoolId();
    if (!studentId) throw new Error('Student ID required');

    // 1. Fetch Student Core Info
    let student: any = null;
    try {
      const { data: st, error } = await this.supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .maybeSingle();
      if (st) student = st;
    } catch (e) {
      console.warn('Fetch student details error:', e);
    }

    if (!student) {
      // Check if studentId is an enrollment ID or admission number
      try {
        const { data: enr } = await this.supabase
          .from('student_enrollments')
          .select('*, student:students(*)')
          .eq('id', studentId)
          .maybeSingle();
        if (enr?.student) {
          student = enr.student;
        }
      } catch {}
    }

    if (!student) {
      throw new Error('Student not found in database');
    }

    const actualStudentId = student.id;

    // 2. Fetch Enrollment Records
    let enrollmentList: any[] = [];
    let currentEnrollment: any = null;
    try {
      const { data: enrs } = await this.supabase
        .from('student_enrollments')
        .select('*, section:sections(*, class:classes(*)), academic_year:academic_years(*)')
        .eq('student_id', actualStudentId)
        .order('created_at', { ascending: false });
      if (enrs && enrs.length > 0) {
        enrollmentList = enrs;
        currentEnrollment = enrs[0];
      }
    } catch {}

    const secMap = this.getStudentSectionMap();
    const mappedSec = secMap[actualStudentId];
    const className = currentEnrollment?.section?.class?.name || mappedSec?.className || 'Class 1';
    const sectionName = currentEnrollment?.section?.name || mappedSec?.sectionName || 'Section A';
    const academicSession = currentEnrollment?.academic_year?.name || '2028-2029';

    // 3. Status & Active Duration
    const localStatusMap = (() => {
      try {
        return JSON.parse(localStorage.getItem('schoolsense_student_statuses') || '{}');
      } catch {
        return {};
      }
    })();
    const statusRecord = localStatusMap[actualStudentId] || localStatusMap[studentId] || {};
    const resolvedStatus = (statusRecord.status || student.status || currentEnrollment?.status || 'ACTIVE').toUpperCase();
    const activeInfo = this.getStudentActiveTimeInfo(actualStudentId, student.created_at, resolvedStatus);

    // 4. Fetch Exam Marks & Academic Performance
    let examMarks: any[] = [];
    try {
      const { data: marks } = await this.supabase
        .from('exam_marks')
        .select('*, exam:exams(*), subject:subjects(*)')
        .eq('student_id', actualStudentId)
        .order('created_at', { ascending: false });
      if (marks && marks.length > 0) {
        examMarks = marks.map((m: any) => ({
          id: m.id,
          exam_name: m.exam?.name || 'Periodic Assessment',
          subject_name: m.subject?.name || 'General Subject',
          marks_obtained: Number(m.marks_obtained || 0),
          max_marks: Number(m.max_marks || 100),
          percentage: Number(((Number(m.marks_obtained || 0) / Number(m.max_marks || 100)) * 100).toFixed(1)),
          grade: m.grade || (Number(m.marks_obtained || 0) >= 80 ? 'A' : (Number(m.marks_obtained || 0) >= 60 ? 'B' : 'C')),
          remarks: m.remarks || 'Standard evaluation recorded',
          date: m.created_at || new Date().toISOString(),
        }));
      }
    } catch {}

    // 5. Fetch Attendance History
    let attendanceRecords: any[] = [];
    let attendanceStats = {
      total_days: 0,
      present_days: 0,
      absent_days: 0,
      late_days: 0,
      excused_days: 0,
      percentage: 100,
    };
    try {
      const { data: attList } = await this.supabase
        .from('attendance')
        .select('*')
        .eq('student_id', actualStudentId)
        .order('date', { ascending: false });
      if (attList && attList.length > 0) {
        attendanceRecords = attList;
        attendanceStats.total_days = attList.length;
        attendanceStats.present_days = attList.filter((a: any) => a.status === 'PRESENT').length;
        attendanceStats.absent_days = attList.filter((a: any) => a.status === 'ABSENT').length;
        attendanceStats.late_days = attList.filter((a: any) => a.status === 'LATE').length;
        attendanceStats.excused_days = attList.filter((a: any) => a.status === 'EXCUSED' || a.status === 'HALF_DAY').length;
        attendanceStats.percentage = attendanceStats.total_days > 0
          ? Number(((attendanceStats.present_days / attendanceStats.total_days) * 100).toFixed(1))
          : 100;
      }
    } catch {}

    // 6. Fetch Complaints & Concerns
    let complaints: any[] = [];
    try {
      const { data: compList } = await this.supabase
        .from('complaints')
        .select('*')
        .eq('school_id', schoolId || student.school_id)
        .order('created_at', { ascending: false });
      if (compList && compList.length > 0) {
        const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim().toLowerCase();
        complaints = compList.filter((c: any) => {
          if (c.student_id === actualStudentId) return true;
          const desc = `${c.title || ''} ${c.description || ''}`.toLowerCase();
          return desc.includes(studentName) || desc.includes(student.admission_number?.toLowerCase() || '###');
        });
      }
    } catch {}

    // 7. Compile Chronological Activity & Audit Timeline Logs
    const activityLogs: any[] = [];

    // Milestone A: Enrolment Record
    const enrolledDate = student.created_at || currentEnrollment?.created_at || new Date().toISOString();
    activityLogs.push({
      id: `log-enrolled-${actualStudentId}`,
      type: 'ENROLLMENT',
      badge_color: 'emerald',
      title: 'Student Admitted & Enrolled',
      timestamp: enrolledDate,
      summary: `Successfully enrolled in ${className} - ${sectionName} with Admission Number ${student.admission_number || 'N/A'}.`,
      author: 'School Admissions Registry',
    });

    // Milestone B: Status Changes History
    if (statusRecord.status_history && Array.isArray(statusRecord.status_history)) {
      statusRecord.status_history.forEach((h: any, idx: number) => {
        const color = h.status === 'ACTIVE' ? 'emerald' : (h.status === 'SUSPENDED' ? 'amber' : 'rose');
        activityLogs.push({
          id: `log-status-${idx}`,
          type: 'STATUS_CHANGE',
          badge_color: color,
          title: `Status Changed to ${h.status}`,
          timestamp: h.timestamp || statusRecord.updated_at,
          summary: `Status updated from ${h.from_status || 'ACTIVE'} to ${h.status}.${h.reason ? ' Reason: "' + h.reason + '"' : ''}`,
          author: 'School Administration',
        });
      });
    } else if (statusRecord.updated_at && resolvedStatus !== 'ACTIVE') {
      const color = resolvedStatus === 'SUSPENDED' ? 'amber' : 'rose';
      activityLogs.push({
        id: `log-status-current`,
        type: 'STATUS_CHANGE',
        badge_color: color,
        title: `Status Marked as ${resolvedStatus}`,
        timestamp: statusRecord.updated_at,
        summary: `Student marked as ${resolvedStatus}.${statusRecord.reason ? ' Reason: "' + statusRecord.reason + '"' : ''}`,
        author: 'School Administration',
      });
    }

    // Milestone C: Exam Results Recorded
    examMarks.forEach((em: any, idx: number) => {
      activityLogs.push({
        id: `log-exam-${em.id || idx}`,
        type: 'ACADEMIC_EXAM',
        badge_color: 'indigo',
        title: `Exam Score Published: ${em.exam_name}`,
        timestamp: em.date,
        summary: `Subject: ${em.subject_name} • Scored: ${em.marks_obtained}/${em.max_marks} (${em.percentage}%, Grade ${em.grade}). Remarks: ${em.remarks}`,
        author: 'Academic Examination Board',
      });
    });

    // Milestone D: Parent / Disciplinary Complaints
    complaints.forEach((comp: any, idx: number) => {
      activityLogs.push({
        id: `log-comp-${comp.id || idx}`,
        type: 'DISCIPLINARY_COMPLAINT',
        badge_color: comp.priority === 'HIGH' ? 'rose' : 'amber',
        title: `Complaint / Parent Concern: ${comp.title}`,
        timestamp: comp.created_at,
        summary: `Category: ${comp.category || 'General'} • Priority: ${comp.priority || 'NORMAL'} • Status: ${comp.status}. Description: ${comp.description || 'No description provided'}`,
        author: comp.created_by_name || 'Parent / Staff Guardian',
      });
    });

    // Sort timeline in descending order (latest first)
    activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 7. Complete List of All Students across all Classes & Sections for Next / Prev Navigation
    let navigation = {
      prevStudentId: null as string | null,
      prevStudentName: null as string | null,
      nextStudentId: null as string | null,
      nextStudentName: null as string | null,
      currentIndex: 1,
      totalStudents: 1,
      allStudents: [] as any[],
    };
    try {
      const activeSessionId = await this.getActiveAcademicYearId(schoolId || student.school_id);
      let enrQuery = this.supabase
        .from('student_enrollments')
        .select('id, roll_number, status, student:students(*), section:sections(*, class:classes(*))');
      if (activeSessionId) {
        enrQuery = enrQuery.eq('academic_year_id', activeSessionId);
      }
      const { data: enrRows } = await enrQuery;

      let studentRoster: any[] = [];
      const secMap = this.getStudentSectionMap();

      if (enrRows && enrRows.length > 0) {
        studentRoster = enrRows
          .filter((r: any) => !!r.student)
          .map((r: any) => {
            const st = r.student;
            const mapped = secMap[st.id] || {};
            const cName = r.section?.class?.name || mapped.className || 'Class';
            const sName = r.section?.name || mapped.sectionName || 'A';
            return {
              id: st.id,
              studentId: st.id,
              enrollmentId: r.id,
              fullName: `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.admission_number || 'Student',
              className: cName,
              sectionName: sName,
              rollNumber: r.roll_number || st.roll_number || '1',
              admissionNumber: st.admission_number || '',
              status: (r.status || st.status || 'ACTIVE').toUpperCase(),
              createdAt: st.created_at,
            };
          });
      }

      // Fallback if enrollments empty
      if (studentRoster.length === 0) {
        let sq = this.supabase.from('students').select('*');
        if (schoolId || student.school_id) {
          sq = sq.eq('school_id', schoolId || student.school_id);
        }
        const { data: rawSts } = await sq.order('created_at', { ascending: true });
        if (rawSts) {
          studentRoster = rawSts.map((st: any) => {
            const mapped = secMap[st.id] || {};
            return {
              id: st.id,
              studentId: st.id,
              fullName: `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.admission_number || 'Student',
              className: mapped.className || 'Class 1',
              sectionName: mapped.sectionName || 'Section A',
              rollNumber: st.roll_number || '1',
              admissionNumber: st.admission_number || '',
              status: (st.status || 'ACTIVE').toUpperCase(),
              createdAt: st.created_at,
            };
          });
        }
      }

      // Filter roster strictly to the current student's class and section
      const sameSectionStudents = studentRoster.filter((s: any) => 
        (s.className === className && s.sectionName === sectionName)
      );

      const targetList = sameSectionStudents.length > 0 ? sameSectionStudents : studentRoster;

      // Sort by roll number, then name
      targetList.sort((a, b) => {
        const rollA = parseInt(String(a.rollNumber), 10) || 0;
        const rollB = parseInt(String(b.rollNumber), 10) || 0;
        if (rollA !== rollB) return rollA - rollB;
        return a.fullName.localeCompare(b.fullName);
      });

      if (targetList.length > 0) {
        navigation.allStudents = targetList;
        const idx = targetList.findIndex((s: any) => s.id === actualStudentId || s.studentId === actualStudentId);
        if (idx !== -1) {
          navigation.currentIndex = idx + 1;
          navigation.totalStudents = targetList.length;
          if (idx > 0) {
            navigation.prevStudentId = targetList[idx - 1].id;
            navigation.prevStudentName = targetList[idx - 1].fullName;
          }
          if (idx < targetList.length - 1) {
            navigation.nextStudentId = targetList[idx + 1].id;
            navigation.nextStudentName = targetList[idx + 1].fullName;
          }
        }
      }
    } catch (e) {
      console.warn('Navigation lookup error:', e);
    }

    // 7. Resolve photo from local cache or student record
    const photosMap = (() => {
      try {
        return JSON.parse(localStorage.getItem('schoolsense_student_photos') || '{}');
      } catch {
        return {};
      }
    })();
    const localPhoto = photosMap[actualStudentId] || photosMap[studentId] || {};
    const resolvedPhotoUrl = localPhoto.photoUrl || localPhoto.photo_url || student.photo_url || student.avatar_url || '';
    const resolvedGuardianPhotoUrl = localPhoto.guardianPhotoUrl || localPhoto.guardian_photo_url || student.guardian_photo_url || student.emergency_contact_photo_url || '';

    return {
      student: {
        ...student,
        id: actualStudentId,
        fullName: `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.admission_number || 'Student',
        photo_url: resolvedPhotoUrl,
        photoUrl: resolvedPhotoUrl,
        avatar_url: resolvedPhotoUrl,
        guardian_photo_url: resolvedGuardianPhotoUrl,
        guardianPhotoUrl: resolvedGuardianPhotoUrl,
        emergency_contact_photo_url: resolvedGuardianPhotoUrl,
        className,
        sectionName,
        academicSession,
        rollNumber: currentEnrollment?.roll_number || student.roll_number || 1,
        status: resolvedStatus,
        activeInfo,
      },
      navigation,
      enrollmentHistory: enrollmentList,
      examMarks,
      attendanceStats,
      attendanceRecords: attendanceRecords.slice(0, 30),
      complaints,
      activityLogs,
    };
  }

  private async updateStudent(studentId: string, body: any): Promise<any> {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    const firstName = (body.firstName || '').trim();
    const lastName = (body.lastName || '').trim();
    const admissionNumber = (body.admissionNumber || '').trim();
    const guardianName = (body.guardianName || body.emergencyContactName || '').trim();
    const guardianPhone = (body.guardianPhone || body.emergencyContactPhone || '').trim();
    const guardianEmail = (body.guardianEmail || '').trim().toLowerCase();

    let dob: string | null = null;
    if (body.dateOfBirth) {
      try {
        const dStr = String(body.dateOfBirth).trim();
        if (dStr.includes('/')) {
          const parts = dStr.split('/');
          if (parts.length === 3 && parts[2].length === 4) {
            dob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        } else {
          dob = new Date(dStr).toISOString().split('T')[0];
        }
      } catch {
        dob = null;
      }
    }

    const studentPhoto = body.photoUrl !== undefined ? body.photoUrl : (body.photo_url !== undefined ? body.photo_url : undefined);
    const guardianPhoto = body.guardianPhotoUrl !== undefined ? body.guardianPhotoUrl : (body.guardian_photo_url !== undefined ? body.guardian_photo_url : undefined);

    // Persist photos to client storage immediately so photos are 100% resilient across page reloads
    if (studentPhoto !== undefined || guardianPhoto !== undefined) {
      try {
        const photosMap = JSON.parse(localStorage.getItem('schoolsense_student_photos') || '{}');
        if (!photosMap[studentId]) {
          photosMap[studentId] = {};
        }
        if (studentPhoto !== undefined) {
          photosMap[studentId].photoUrl = studentPhoto;
          photosMap[studentId].photo_url = studentPhoto;
        }
        if (guardianPhoto !== undefined) {
          photosMap[studentId].guardianPhotoUrl = guardianPhoto;
          photosMap[studentId].guardian_photo_url = guardianPhoto;
        }
        localStorage.setItem('schoolsense_student_photos', JSON.stringify(photosMap));
      } catch (storageErr) {
        console.warn('Student photo cache error:', storageErr);
      }
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (body.firstName !== undefined) updatePayload.first_name = firstName;
    if (body.lastName !== undefined) updatePayload.last_name = lastName || null;
    if (body.gender !== undefined) updatePayload.gender = body.gender;
    if (dob) updatePayload.date_of_birth = dob;
    if (body.bloodGroup !== undefined) updatePayload.blood_group = body.bloodGroup || null;
    if (guardianName) updatePayload.emergency_contact_name = guardianName;
    if (guardianPhone) updatePayload.emergency_contact_phone = guardianPhone;
    if (admissionNumber) updatePayload.admission_number = admissionNumber;
    if (studentPhoto !== undefined) {
      updatePayload.photo_url = studentPhoto || null;
    }
    if (guardianPhoto !== undefined) {
      updatePayload.guardian_photo_url = guardianPhoto || null;
    }

    try {
      const { error } = await this.supabase.from('students').update(updatePayload).eq('id', studentId);
      if (error) {
        console.warn('Update student Supabase initial error:', error);
        // If column error (e.g. PGRST204), retry without photo_url / guardian_photo_url
        if (error.code === 'PGRST204' || (error.message && (error.message.includes('column') || error.message.includes('schema cache')))) {
          delete updatePayload.photo_url;
          delete updatePayload.guardian_photo_url;
          if (Object.keys(updatePayload).length > 1) {
            await this.supabase.from('students').update(updatePayload).eq('id', studentId);
          }
        }
      }
    } catch (e) {
      console.warn('Update student table note:', e);
    }

    // Update section and roll number in student_enrollments
    if (body.sectionId || body.rollNumber) {
      const enrUpdate: any = {};
      if (body.sectionId) enrUpdate.section_id = body.sectionId;
      if (body.rollNumber) enrUpdate.roll_number = String(body.rollNumber);
      enrUpdate.updated_at = new Date().toISOString();

      try {
        await this.supabase.from('student_enrollments').update(enrUpdate).eq('student_id', studentId);
      } catch (e) {
        console.warn('Update student_enrollments note:', e);
      }
    }

    // Update local section map
    if (body.classId || body.sectionId || body.rollNumber) {
      this.setStudentSection(studentId, {
        classId: body.classId,
        sectionId: body.sectionId,
        rollNumber: body.rollNumber ? String(body.rollNumber) : undefined,
      });
    }

    // Update parent/guardian user if email or phone is updated
    if (guardianEmail || guardianPhone) {
      await this.ensureParentUserAndGuardian(schoolId, studentId, body);
    }

    return { success: true, message: 'Student details updated successfully' };
  }

  // Student Promotion, Demotion, Section Change & Alumni Direct Actions
  public async promoteStudent(body: any): Promise<any> {
    const schoolId = this.getSchoolId();
    const studentId = body.studentId || body.id;
    if (!studentId) throw new Error('Student ID is required');

    const targetClassId = body.targetClassId || body.classId;
    const targetSectionId = body.targetSectionId || body.sectionId;
    const targetClassName = body.targetClassName || body.className;
    const targetSectionName = body.targetSectionName || body.sectionName;
    const rollNumber = body.rollNumber ? String(body.rollNumber) : undefined;
    const academicYearId = body.academicYearId || (await this.getActiveAcademicYearId(schoolId));
    const nowIso = new Date().toISOString();

    if (targetClassId || targetSectionId) {
      try {
        const enrPayload: any = {
          school_id: schoolId,
          student_id: studentId,
          class_id: targetClassId,
          section_id: targetSectionId,
          status: 'ACTIVE',
          updated_at: nowIso,
        };
        if (rollNumber) enrPayload.roll_number = rollNumber;
        if (academicYearId) enrPayload.academic_year_id = academicYearId;

        let existingQuery = this.supabase
          .from('student_enrollments')
          .select('id')
          .eq('student_id', studentId);
        if (academicYearId) existingQuery = existingQuery.eq('academic_year_id', academicYearId);
        const { data: existingEnr } = await existingQuery.maybeSingle();

        if (existingEnr?.id) {
          await this.supabase
            .from('student_enrollments')
            .update(enrPayload)
            .eq('id', existingEnr.id);
        } else {
          await this.supabase
            .from('student_enrollments')
            .insert(enrPayload);
        }
      } catch (e) {
        console.warn('Supabase promote student enrollment update note:', e);
      }
    }

    await this.updateStudentStatus(studentId, 'ACTIVE', body.reason || 'Promoted to next class');

    this.setStudentSection(
      studentId,
      {
        classId: targetClassId,
        className: targetClassName,
        sectionId: targetSectionId,
        sectionName: targetSectionName,
        rollNumber: rollNumber,
      },
      academicYearId
    );
    this.setStudentSection(studentId, {
      classId: targetClassId,
      className: targetClassName,
      sectionId: targetSectionId,
      sectionName: targetSectionName,
      rollNumber: rollNumber,
    });

    return {
      success: true,
      message: `Student successfully promoted to ${targetClassName || 'next class'}${targetSectionName ? ' - ' + targetSectionName : ''}.`,
    };
  }

  public async demoteStudent(body: any): Promise<any> {
    const schoolId = this.getSchoolId();
    const studentId = body.studentId || body.id;
    if (!studentId) throw new Error('Student ID is required');

    const targetClassId = body.targetClassId || body.classId;
    const targetSectionId = body.targetSectionId || body.sectionId;
    const targetClassName = body.targetClassName || body.className;
    const targetSectionName = body.targetSectionName || body.sectionName;
    const rollNumber = body.rollNumber ? String(body.rollNumber) : undefined;
    const academicYearId = body.academicYearId || (await this.getActiveAcademicYearId(schoolId));
    const nowIso = new Date().toISOString();

    if (targetClassId || targetSectionId) {
      try {
        const enrPayload: any = {
          school_id: schoolId,
          student_id: studentId,
          class_id: targetClassId,
          section_id: targetSectionId,
          status: 'ACTIVE',
          updated_at: nowIso,
        };
        if (rollNumber) enrPayload.roll_number = rollNumber;
        if (academicYearId) enrPayload.academic_year_id = academicYearId;

        let existingQuery = this.supabase
          .from('student_enrollments')
          .select('id')
          .eq('student_id', studentId);
        if (academicYearId) existingQuery = existingQuery.eq('academic_year_id', academicYearId);
        const { data: existingEnr } = await existingQuery.maybeSingle();

        if (existingEnr?.id) {
          await this.supabase
            .from('student_enrollments')
            .update(enrPayload)
            .eq('id', existingEnr.id);
        } else {
          await this.supabase
            .from('student_enrollments')
            .insert(enrPayload);
        }
      } catch (e) {
        console.warn('Supabase demote student enrollment update note:', e);
      }
    }

    await this.updateStudentStatus(studentId, 'ACTIVE', body.reason || 'Demoted / moved to previous class');

    this.setStudentSection(
      studentId,
      {
        classId: targetClassId,
        className: targetClassName,
        sectionId: targetSectionId,
        sectionName: targetSectionName,
        rollNumber: rollNumber,
      },
      academicYearId
    );
    this.setStudentSection(studentId, {
      classId: targetClassId,
      className: targetClassName,
      sectionId: targetSectionId,
      sectionName: targetSectionName,
      rollNumber: rollNumber,
    });

    return {
      success: true,
      message: `Student reassigned to ${targetClassName || 'previous class'}${targetSectionName ? ' - ' + targetSectionName : ''}.`,
    };
  }

  public async changeStudentSection(body: any): Promise<any> {
    const schoolId = this.getSchoolId();
    const studentId = body.studentId || body.id;
    if (!studentId) throw new Error('Student ID is required');

    const targetSectionId = body.targetSectionId || body.sectionId;
    const targetSectionName = body.targetSectionName || body.sectionName;
    const targetClassId = body.targetClassId || body.classId;
    const targetClassName = body.targetClassName || body.className;
    const rollNumber = body.rollNumber ? String(body.rollNumber) : undefined;
    const academicYearId = body.academicYearId || (await this.getActiveAcademicYearId(schoolId));
    const nowIso = new Date().toISOString();

    if (targetSectionId) {
      try {
        const enrPayload: any = {
          section_id: targetSectionId,
          updated_at: nowIso,
        };
        if (targetClassId) enrPayload.class_id = targetClassId;
        if (rollNumber) enrPayload.roll_number = rollNumber;

        let query = this.supabase
          .from('student_enrollments')
          .update(enrPayload)
          .eq('student_id', studentId);
        if (academicYearId) query = query.eq('academic_year_id', academicYearId);
        await query;
      } catch (e) {
        console.warn('Supabase change student section note:', e);
      }
    }

    this.setStudentSection(
      studentId,
      {
        classId: targetClassId,
        className: targetClassName,
        sectionId: targetSectionId,
        sectionName: targetSectionName,
        rollNumber: rollNumber,
      },
      academicYearId
    );
    this.setStudentSection(studentId, {
      classId: targetClassId,
      className: targetClassName,
      sectionId: targetSectionId,
      sectionName: targetSectionName,
      rollNumber: rollNumber,
    });

    return {
      success: true,
      message: `Student section successfully changed to ${targetSectionName || 'selected section'}.`,
    };
  }

  public async convertStudentToAlumni(body: any): Promise<any> {
    const schoolId = this.getSchoolId();
    const studentId = body.studentId || body.id;
    if (!studentId) throw new Error('Student ID is required');

    const sessionName = body.sessionName || body.passingSession || '2025–2026';
    const graduatingClassId = body.graduatingClassId || body.classId;
    const graduatingSectionId = body.graduatingSectionId || body.sectionId;
    const graduatingClassName = body.graduatingClassName || body.className;
    const graduatingSectionName = body.graduatingSectionName || body.sectionName;
    const leavingCertificateNumber = body.leavingCertificateNumber || body.tcNumber || '';
    const remarks = body.reason || body.remarks || 'Graduated / Completed studies and moved to Alumni';
    const academicYearId = body.academicYearId || (await this.getActiveAcademicYearId(schoolId));
    const nowIso = new Date().toISOString();

    // 1. Mark status ALUMNI in students table and enrollments
    await this.updateStudentStatus(studentId, 'ALUMNI', remarks);

    // 2. Record in alumni info store
    try {
      const alumniStoreKey = `schoolsense_alumni_info_${schoolId || 'default'}`;
      const raw = localStorage.getItem(alumniStoreKey) || '{}';
      const map = JSON.parse(raw);
      map[studentId] = {
        sessionName,
        graduatingClassId,
        graduatingClassName,
        graduatingSectionId,
        graduatingSectionName,
        leavingCertificateNumber,
        remarks,
        convertedAt: nowIso,
      };
      localStorage.setItem(alumniStoreKey, JSON.stringify(map));
    } catch {}

    // 3. Update section map with graduating details
    if (graduatingClassId || graduatingSectionId) {
      this.setStudentSection(
        studentId,
        {
          classId: graduatingClassId,
          className: graduatingClassName,
          sectionId: graduatingSectionId,
          sectionName: graduatingSectionName,
        },
        academicYearId
      );
      this.setStudentSection(studentId, {
        classId: graduatingClassId,
        className: graduatingClassName,
        sectionId: graduatingSectionId,
        sectionName: graduatingSectionName,
      });
    }

    return {
      success: true,
      message: `Student successfully graduated/converted to Alumni (${graduatingClassName || 'Current Class'}, Session: ${sessionName}).`,
    };
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
      request_type: (payload.requestType || payload.type || 'INACTIVE').toUpperCase(),
      student_id: payload.studentId,
      student_name: payload.studentName,
      admission_number: payload.admissionNumber || '',
      class_id: payload.classId || '',
      class_name: payload.className || '',
      section_id: payload.sectionId || '',
      section_name: payload.sectionName || '',
      target_class_id: payload.targetClassId || '',
      target_class_name: payload.targetClassName || '',
      target_section_id: payload.targetSectionId || '',
      target_section_name: payload.targetSectionName || '',
      target_roll_number: payload.targetRollNumber || payload.rollNumber || '',
      target_status: payload.targetStatus || '',
      passing_session: payload.passingSession || payload.sessionName || '',
      leaving_certificate_number: payload.leavingCertificateNumber || payload.tcNumber || '',
      requested_by_user_id: currentUser?.id || '',
      requested_by_name: `${currentUser?.firstName || currentUser?.first_name || ''} ${currentUser?.lastName || currentUser?.last_name || ''}`.trim() || 'Teacher',
      requested_by_role: currentUser?.role || 'TEACHER',
      reason: payload.reason || 'Academic update requested by teacher',
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
      message: 'Student academic action request submitted to School Administration for review.',
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

    let targetReq: any = null;
    try {
      const raw = localStorage.getItem('schoolsense_deactivation_requests');
      if (raw) {
        const list = JSON.parse(raw);
        const idx = list.findIndex((r: any) => r.id === requestId);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...reviewData };
          targetReq = list[idx];
          localStorage.setItem('schoolsense_deactivation_requests', JSON.stringify(list));
        }
      }
    } catch {}

    if (action === 'APPROVE' && targetReq && targetReq.student_id) {
      const reqType = (targetReq.request_type || 'INACTIVE').toUpperCase();
      const reason = targetReq.reason || `Approved by administration from ${targetReq.requested_by_name || 'teacher'} request`;

      if (reqType === 'PROMOTION') {
        await this.promoteStudent({
          studentId: targetReq.student_id,
          targetClassId: targetReq.target_class_id,
          targetClassName: targetReq.target_class_name,
          targetSectionId: targetReq.target_section_id,
          targetSectionName: targetReq.target_section_name,
          rollNumber: targetReq.target_roll_number,
          reason,
        });
      } else if (reqType === 'DEMOTION') {
        await this.demoteStudent({
          studentId: targetReq.student_id,
          targetClassId: targetReq.target_class_id,
          targetClassName: targetReq.target_class_name,
          targetSectionId: targetReq.target_section_id,
          targetSectionName: targetReq.target_section_name,
          rollNumber: targetReq.target_roll_number,
          reason,
        });
      } else if (reqType === 'SECTION_CHANGE') {
        await this.changeStudentSection({
          studentId: targetReq.student_id,
          targetClassId: targetReq.target_class_id || targetReq.class_id,
          targetClassName: targetReq.target_class_name || targetReq.class_name,
          targetSectionId: targetReq.target_section_id,
          targetSectionName: targetReq.target_section_name,
          rollNumber: targetReq.target_roll_number,
          reason,
        });
      } else if (reqType === 'ALUMNI') {
        await this.convertStudentToAlumni({
          studentId: targetReq.student_id,
          sessionName: targetReq.passing_session,
          graduatingClassId: targetReq.class_id,
          graduatingClassName: targetReq.class_name,
          graduatingSectionId: targetReq.section_id,
          graduatingSectionName: targetReq.section_name,
          leavingCertificateNumber: targetReq.leaving_certificate_number,
          reason,
        });
      } else if (reqType === 'SUSPENDED') {
        await this.updateStudentStatus(targetReq.student_id, 'SUSPENDED', reason);
      } else if (reqType === 'LEFTOUT') {
        await this.updateStudentStatus(targetReq.student_id, 'LEFTOUT', reason);
      } else {
        await this.updateStudentStatus(targetReq.student_id, 'INACTIVE', reason);
      }
    }

    return {
      success: true,
      status: newStatus,
      message: `Academic request ${newStatus.toLowerCase()} successfully.${
        action === 'APPROVE' ? ' Action has been executed.' : ''
      }`,
    };
  }

  // Student Section Mapping Helpers (ensures seamless roster sync across views with strict session partitioning)
  public getStudentSectionMap(academicYearId?: string): Record<string, { classId?: string; className?: string; sectionId?: string; sectionName?: string; rollNumber?: string }> {
    try {
      if (academicYearId) {
        const sessionRaw = localStorage.getItem(`schoolsense_student_sections_${academicYearId}`);
        if (sessionRaw) return JSON.parse(sessionRaw);
        return {};
      }
      const raw = localStorage.getItem('schoolsense_student_sections');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  public setStudentSection(
    studentId: string,
    info: { classId?: string; className?: string; sectionId?: string; sectionName?: string; rollNumber?: string },
    academicYearId?: string
  ): void {
    try {
      if (academicYearId) {
        const sessionMap = this.getStudentSectionMap(academicYearId);
        sessionMap[studentId] = { ...(sessionMap[studentId] || {}), ...info };
        localStorage.setItem(`schoolsense_student_sections_${academicYearId}`, JSON.stringify(sessionMap));
      } else {
        const map = this.getStudentSectionMap();
        map[studentId] = { ...(map[studentId] || {}), ...info };
        localStorage.setItem('schoolsense_student_sections', JSON.stringify(map));
      }
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
      secName = sec?.name || 'Section A';
      clsName = (sec?.class as any)?.name || '';
      classId = sec?.class_id || (sec?.class as any)?.id || '';
    } catch {}

    const localStatusMap = (() => {
      try {
        return JSON.parse(localStorage.getItem('schoolsense_student_statuses') || '{}');
      } catch {
        return {};
      }
    })();

    const photosMap = (() => {
      try {
        return JSON.parse(localStorage.getItem('schoolsense_student_photos') || '{}');
      } catch {
        return {};
      }
    })();

    const localMap = this.getStudentSectionMap(effectiveYearId);

    let enrollments: any[] = [];

    // 1. Query student_enrollments strictly for this academic session
    try {
      let query = this.supabase
        .from('student_enrollments')
        .select('*, student:students(*), section:sections(id, name, class_id, class:classes(id, name))');

      if (effectiveYearId) {
        query = query.eq('academic_year_id', effectiveYearId);
      }

      const { data: allSessionEnrolls, error } = await query;
      if (!error && allSessionEnrolls && allSessionEnrolls.length > 0) {
        // Group by student ID to ensure each student has exactly ONE authoritative enrollment record
        const latestEnrollmentByStudent = new Map<string, any>();
        for (const e of allSessionEnrolls) {
          const sId = e.student_id || e.student?.id;
          if (!sId) continue;
          const existing = latestEnrollmentByStudent.get(sId);
          if (!existing) {
            latestEnrollmentByStudent.set(sId, e);
          } else {
            const prevTime = new Date(existing.updated_at || existing.created_at || 0).getTime();
            const currTime = new Date(e.updated_at || e.created_at || 0).getTime();
            if (currTime > prevTime) {
              latestEnrollmentByStudent.set(sId, e);
            }
          }
        }

        const uniqueEnrolls = Array.from(latestEnrollmentByStudent.values());

        // Strictly filter to the target class and section
        enrollments = uniqueEnrolls.filter((e: any) => {
          const sId = e.student_id || e.student?.id;
          const stInfo = localMap[sId];

          // Determine the student's current authoritative section and class
          const effectiveSectionId = stInfo?.sectionId || e.section_id;
          const effectiveClassId = stInfo?.classId || e.class_id || e.section?.class_id || (e.section?.class as any)?.id;
          const effectiveClassName = (stInfo?.className || (e.section?.class as any)?.name || '').trim().toLowerCase();
          const effectiveSecName = (stInfo?.sectionName || e.section?.name || 'section a').trim().toLowerCase();

          const targetSecName = (secName || 'section a').trim().toLowerCase();
          const targetClsName = (clsName || '').trim().toLowerCase();

          // Direct section ID match
          if (effectiveSectionId && sectionId && effectiveSectionId === sectionId) {
            return true;
          }

          // Strict Class name and Section name match
          const isClassMatch = (classId && effectiveClassId && effectiveClassId === classId) ||
                               (targetClsName && effectiveClassName && effectiveClassName === targetClsName);
          const isSecMatch = effectiveSecName === targetSecName;

          return isClassMatch && isSecMatch;
        });
      }
    } catch (e) {
      console.warn('Query student_enrollments failed:', e);
    }

    // 2. If enrollments returned results, format and return
    if (enrollments && enrollments.length > 0) {
      return enrollments
        .filter((e: any) => !!e.student)
        .map((e: any) => {
          const st = e.student || {};
          const fullName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.admission_number || 'Student';
          const localOverride = localStatusMap[st.id]?.status || localStatusMap[e.id]?.status || (e.student_id ? localStatusMap[e.student_id]?.status : null);
          const rawStatus = localOverride || (e.status && e.status !== 'ALUMNI' ? e.status : null) || (st.status === 'ALUMNI' ? 'ACTIVE' : st.status) || 'ACTIVE';
          const stStatus = String(rawStatus).toUpperCase() === 'ALUMNI' ? 'ACTIVE' : String(rawStatus).toUpperCase();
          const activeInfo = this.getStudentActiveTimeInfo(st.id || e.id, e.created_at || st.created_at, stStatus);

          const studentLocalPhoto = photosMap[st.id] || photosMap[e.id] || (e.student_id ? photosMap[e.student_id] : null) || {};
          const resolvedPhotoUrl = studentLocalPhoto.photoUrl || studentLocalPhoto.photo_url || st.photo_url || st.avatar_url || '';
          const resolvedGuardianPhotoUrl = studentLocalPhoto.guardianPhotoUrl || studentLocalPhoto.guardian_photo_url || st.guardian_photo_url || st.emergency_contact_photo_url || '';

          const stLocalInfo = localMap[st.id] || {};
          const resolvedClassName = stLocalInfo.className || clsName || (e.section?.class as any)?.name || 'Class 1';
          const resolvedSectionName = stLocalInfo.sectionName || secName || e.section?.name || 'Section A';

          return {
            id: st.id || e.id,
            enrollmentId: e.id,
            studentId: st.id,
            admissionNumber: st.admission_number || '',
            firstName: st.first_name || '',
            lastName: st.last_name || '',
            fullName,
            rollNumber: Number(stLocalInfo.rollNumber || e.roll_number) || 1,
            gender: st.gender || 'MALE',
            dateOfBirth: st.date_of_birth,
            bloodGroup: st.blood_group,
            className: resolvedClassName,
            sectionName: resolvedSectionName,
            photoUrl: resolvedPhotoUrl,
            photo_url: resolvedPhotoUrl,
            guardianPhotoUrl: resolvedGuardianPhotoUrl,
            primaryContact: {
              first_name: st.emergency_contact_name || 'Guardian',
              last_name: '',
              phone: st.emergency_contact_phone || '',
              email: '',
              photo_url: resolvedGuardianPhotoUrl,
              photoUrl: resolvedGuardianPhotoUrl,
              relationship: 'Guardian',
            },
            status: stStatus,
            activeHours: activeInfo.activeHours,
            activeDays: activeInfo.activeDays,
            activeTimeFormatted: activeInfo.activeTimeFormatted,
            isBillable: activeInfo.isBillable,
          };
        })
        .sort((a, b) => a.rollNumber - b.rollNumber);
    }

    // 3. Fallback: ONLY run if 0 enrollments exist in the entire database across ALL sessions (initial bootstrap)
    try {
      const { count: globalEnrCount } = await this.supabase
        .from('student_enrollments')
        .select('id', { count: 'exact', head: true });

      if (!globalEnrCount || globalEnrCount === 0) {
        const { data: allStudents } = await this.supabase
          .from('students')
          .select('*')
          .eq('school_id', schoolId);

        if (allStudents && allStudents.length > 0) {
          const targetSecName = (secName || 'section a').trim().toLowerCase();

          const matchedStudents = allStudents.filter((st: any) => {
            const info = localMap[st.id];
            if (!info) return false;
            if (info.sectionId === sectionId) return true;

            const classMatch = (classId && info.classId === classId) ||
                               (clsName && info.className && info.className.trim().toLowerCase() === clsName.trim().toLowerCase());
            const secMatch = (info.sectionName || 'section a').trim().toLowerCase() === targetSecName;
            return classMatch && secMatch;
          });

          if (matchedStudents.length > 0) {
            // Auto-persist enrollments into student_enrollments
            if (effectiveYearId && sectionId) {
              if (!classId && schoolId) {
                try {
                  const { data: cls } = await this.supabase
                    .from('classes')
                    .select('id, name')
                    .eq('school_id', schoolId)
                    .limit(1)
                    .maybeSingle();
                  if (cls) classId = cls.id;
                } catch {}
              }

              if (classId) {
                const enrollmentsToCreate = matchedStudents.map((st: any) => ({
                  student_id: st.id,
                  section_id: sectionId,
                  class_id: classId || localMap[st.id]?.classId,
                  academic_year_id: effectiveYearId,
                  roll_number: localMap[st.id]?.rollNumber ? String(localMap[st.id].rollNumber) : '1',
                  status: 'ACTIVE',
                })).filter((e: any) => !!e.class_id);

                if (enrollmentsToCreate.length > 0) {
                  try {
                    await this.supabase.from('student_enrollments').insert(enrollmentsToCreate);
                  } catch {}
                }
              }
            }

            return matchedStudents
              .map((st: any) => {
                const info = localMap[st.id] || {};
                const fullName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.admission_number || 'Student';
                const localOverride = localStatusMap[st.id]?.status;
                const rawStatus = localOverride || (st.status === 'ALUMNI' ? 'ACTIVE' : st.status) || 'ACTIVE';
                const stStatus = String(rawStatus).toUpperCase() === 'ALUMNI' ? 'ACTIVE' : String(rawStatus).toUpperCase();
                const activeInfo = this.getStudentActiveTimeInfo(st.id, st.created_at, stStatus);

                const studentLocalPhoto = photosMap[st.id] || {};
                const resolvedPhotoUrl = studentLocalPhoto.photoUrl || studentLocalPhoto.photo_url || st.photo_url || st.avatar_url || '';
                const resolvedGuardianPhotoUrl = studentLocalPhoto.guardianPhotoUrl || studentLocalPhoto.guardian_photo_url || st.guardian_photo_url || st.emergency_contact_photo_url || '';

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
                  photoUrl: resolvedPhotoUrl,
                  photo_url: resolvedPhotoUrl,
                  guardianPhotoUrl: resolvedGuardianPhotoUrl,
                  primaryContact: {
                    first_name: st.emergency_contact_name || 'Guardian',
                    last_name: '',
                    phone: st.emergency_contact_phone || '',
                    email: '',
                    photo_url: resolvedGuardianPhotoUrl,
                    photoUrl: resolvedGuardianPhotoUrl,
                    relationship: 'Guardian',
                  },
                  status: stStatus,
                  activeHours: activeInfo.activeHours,
                  activeDays: activeInfo.activeDays,
                  activeTimeFormatted: activeInfo.activeTimeFormatted,
                  isBillable: activeInfo.isBillable,
                };
              })
              .sort((a, b) => a.rollNumber - b.rollNumber);
          }
        }
      }
    } catch (fallbackErr) {
      console.warn('Fallback section student resolution error:', fallbackErr);
    }

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

  private async getExams(academicYearId?: string): Promise<Exam[]> {
    const schoolId = this.getSchoolId();
    const effectiveYearId = academicYearId || (await this.getActiveAcademicYearId(schoolId));
    let query = this.supabase.from('exams').select('*, exam_schedules(*, subject:subjects(*), class:classes(*))');
    if (schoolId) query = query.eq('school_id', schoolId);
    if (effectiveYearId) query = query.eq('academic_year_id', effectiveYearId);
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
    const { data: allClasses, error: classErr } = await this.supabase
      .from('classes')
      .select('*, sections(*)')
      .eq('school_id', schoolId)
      .order('display_order', { ascending: true });

    if (classErr) throw classErr;

    const classList = (allClasses || []).sort(
      (a: any, b: any) => getClassPedagogicalRank(a.name, a.code, a.display_order) - getClassPedagogicalRank(b.name, b.code, b.display_order)
    );
    if (classList.length === 0) {
      return { success: true, promoted_count: 0, graduated_alumni_count: 0, graduated_count: 0 };
    }

    // 2. Ensure ALL classes have their sections auto-provisioned/replicated for the target session (toSessionId)
    const targetSectionsByClass: Record<string, any[]> = {};
    for (const cls of classList) {
      targetSectionsByClass[cls.id] = [];
      const existingSecs = cls.sections || [];

      // Collect distinct section templates for this class (e.g. Section A, Section B...)
      const distinctSecMap = new Map<string, any>();
      existingSecs.forEach((s: any) => {
        const key = (s.name || '').trim().toLowerCase();
        if (key && !distinctSecMap.has(key)) {
          distinctSecMap.set(key, s);
        }
      });

      // If no section template exists for this class, create default Section A template
      if (distinctSecMap.size === 0) {
        distinctSecMap.set('section a', {
          name: 'Section A',
          code: 'A',
          capacity: 40,
          display_order: 1,
        });
      }

      // Check existing sections in target session for this class
      const targetSecsInClass = existingSecs.filter((s: any) => s.academic_year_id === toSessionId);

      for (const [secKey, secTpl] of distinctSecMap.entries()) {
        const alreadyExists = targetSecsInClass.find(
          (s: any) => (s.name || '').trim().toLowerCase() === secKey
        );
        if (alreadyExists) {
          targetSectionsByClass[cls.id].push(alreadyExists);
        } else {
          try {
            const { data: createdSec } = await this.supabase
              .from('sections')
              .insert({
                school_id: schoolId,
                class_id: cls.id,
                academic_year_id: toSessionId,
                name: secTpl.name || 'Section A',
                code: secTpl.code || (secTpl.name || 'A').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'A',
                capacity: secTpl.capacity || 40,
                display_order: secTpl.display_order || 1,
                status: 'ACTIVE',
              })
              .select()
              .single();

            if (createdSec) {
              targetSectionsByClass[cls.id].push(createdSec);
              if (!cls.sections) cls.sections = [];
              cls.sections.push(createdSec);
            }
          } catch (secInsertErr) {
            console.warn('Auto-create section for session note:', secInsertErr);
          }
        }
      }
    }

    // 3. Fetch active enrollments from the source session
    let enrollments: any[] = [];
    if (fromSessionId) {
      const { data: sessionEnrolls } = await this.supabase
        .from('student_enrollments')
        .select('*, section:sections(*), student:students(*)')
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
        .neq('status', 'INACTIVE')
        .neq('status', 'ALUMNI');

      enrollments = (activeStudents || []).map((st: any) => {
        const info = localMap[st.id];
        return {
          student_id: st.id,
          student: st,
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

    // Filter out any student that is already graduated / ALUMNI
    const validEnrollments = enrollments.filter(
      (e: any) => e.student?.status !== 'ALUMNI' && e.status !== 'INACTIVE'
    );

    for (const e of validEnrollments) {
      const classId = e.section?.class_id || e.class_id;
      let currentClassIdx = classList.findIndex((c: any) => c.id === classId);
      if (currentClassIdx === -1) {
        const enrClsName = (e.section?.class?.name || e.class?.name || '').trim().toLowerCase();
        if (enrClsName) {
          currentClassIdx = classList.findIndex((c: any) => (c.name || '').trim().toLowerCase() === enrClsName);
        }
      }

      // If student is in the school's terminal / last class, graduate them to ALUMNI
      if (currentClassIdx === classList.length - 1 || (currentClassIdx === -1 && classList.length === 1)) {
        graduatedStudentIds.push(e.student_id);
        graduatedCount++;
      } else if (currentClassIdx !== -1 && currentClassIdx < classList.length - 1) {
        // Promote to the next sequential class
        const nextClass = classList[currentClassIdx + 1];
        const nextClassSecs = targetSectionsByClass[nextClass.id] || [];
        const curSecName = e.section?.name || 'Section A';

        // Match same section name (e.g. Section A -> Section A in next class) or fallback to first section
        let targetSection = nextClassSecs.find(
          (s: any) => (s.name || '').trim().toLowerCase() === curSecName.trim().toLowerCase()
        ) || nextClassSecs[0];

        if (targetSection?.id) {
          newEnrollmentsToInsert.push({
            student_id: e.student_id,
            section_id: targetSection.id,
            class_id: nextClass.id,
            academic_year_id: toSessionId,
            roll_number: e.roll_number || '1',
            status: 'ACTIVE',
          });
          this.setStudentSection(e.student_id, {
            classId: nextClass.id,
            className: nextClass.name,
            sectionId: targetSection.id,
            sectionName: targetSection.name,
            rollNumber: e.roll_number ? String(e.roll_number) : '1',
          }, toSessionId);
          promotedCount++;
        }
      }
    }

    // 4. Update graduated students to ALUMNI in students table
    if (graduatedStudentIds.length > 0) {
      try {
        await this.supabase.from('students').update({ status: 'ALUMNI' }).in('id', graduatedStudentIds);
      } catch (err) {
        console.warn('Mark alumni error:', err);
      }
    }

    // 5. Insert promoted enrollments into student_enrollments in chunks
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

  private async getAlumniStudents(academicYearId?: string): Promise<AlumniStudent[]> {
    const schoolId = this.getSchoolId();
    if (!schoolId) return [];

    try {
      const effectiveYearId = academicYearId || (await this.getActiveAcademicYearId(schoolId));

      // 1. Fetch chronological list of academic sessions for this school
      const { data: allSessions } = await this.supabase
        .from('academic_years')
        .select('id, name, start_date, end_date, created_at')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: true });

      const sortedSessions = (allSessions || []).sort((a: any, b: any) => {
        const da = new Date(a.start_date || a.created_at).getTime();
        const db = new Date(b.start_date || b.created_at).getTime();
        return da - db;
      });

      const currentSesIdx = effectiveYearId
        ? sortedSessions.findIndex((s: any) => s.id === effectiveYearId)
        : sortedSessions.length - 1;

      // 2. Fetch all students marked ALUMNI
      const { data: students, error } = await this.supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .eq('status', 'ALUMNI');

      if (error || !students || students.length === 0) {
        return [];
      }

      const studentIds = students.map((s: any) => s.id);
      let enrollmentsMap: Record<string, any> = {};
      let firstEnrollmentsMap: Record<string, any> = {};
      if (studentIds.length > 0) {
        const { data: enrolls } = await this.supabase
          .from('student_enrollments')
          .select('*, section:sections(*, class:classes(*)), academic_year:academic_years(*)')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false });
        (enrolls || []).forEach((en: any) => {
          if (!enrollmentsMap[en.student_id]) enrollmentsMap[en.student_id] = en;
        });

        // Also find first enrollment for admission grade
        const reversedEnrolls = [...(enrolls || [])].reverse();
        reversedEnrolls.forEach((en: any) => {
          if (!firstEnrollmentsMap[en.student_id]) firstEnrollmentsMap[en.student_id] = en;
        });
      }

      // 3. Load stored alumni info map
      const alumniStoreKey = `schoolsense_alumni_info_${schoolId || 'default'}`;
      const rawAlumni = localStorage.getItem(alumniStoreKey) || '{}';
      const alumniMap = JSON.parse(rawAlumni);

      const list: AlumniStudent[] = [];
      for (const st of students) {
        const lastEnrollment = enrollmentsMap[st.id];
        const firstEnrollment = firstEnrollmentsMap[st.id];
        const storedInfo = alumniMap[st.id] || {};

        const gradSessionId = lastEnrollment?.academic_year_id || lastEnrollment?.academic_year?.id;
        const gradSessionIdx = gradSessionId
          ? sortedSessions.findIndex((s: any) => s.id === gradSessionId)
          : -1;

        // ONLY show in Alumni Directory if graduation session was strictly BEFORE the active session
        if (currentSesIdx !== -1 && gradSessionIdx !== -1 && gradSessionIdx >= currentSesIdx) {
          continue; // In this session, they were an active enrolled student (not an alumnus yet)
        }

        const terminalClass = storedInfo.graduatingClassName || lastEnrollment?.section?.class?.name || lastEnrollment?.class?.name || 'Class 12';
        const terminalSection = storedInfo.graduatingSectionName || lastEnrollment?.section?.name || 'Section A';
        const gradSession = storedInfo.sessionName || lastEnrollment?.academic_year?.name || 'Graduated';

        const cleanAdm = String(st.admission_number || '0000').replace(/[^a-zA-Z0-9]/g, '');
        const gradYear = (gradSession.match(/\d{4}/) ? gradSession.match(/\d{4}/)![0] : new Date().getFullYear());
        const alumniNumber = storedInfo.alumniNumber || `ALU-${gradYear}-${cleanAdm.padStart(4, '0')}`;
        const tcNumber = storedInfo.leavingCertificateNumber || storedInfo.tcNumber || `TC/${gradYear}/${cleanAdm.padStart(4, '0')}`;

        list.push({
          student_id: st.id,
          admission_number: st.admission_number,
          alumni_number: alumniNumber,
          first_name: st.first_name,
          last_name: st.last_name,
          full_name: `${st.first_name || ''} ${st.last_name || ''}`.trim(),
          gender: st.gender,
          date_of_birth: st.date_of_birth,
          dateOfBirth: st.date_of_birth,
          blood_group: st.blood_group,
          status: 'ALUMNI',
          last_class_name: terminalClass,
          last_section_name: terminalSection,
          graduation_session: gradSession,
          last_roll_number: lastEnrollment?.roll_number,
          admission_date: st.admission_date || st.created_at || firstEnrollment?.created_at,
          admission_class_name: firstEnrollment?.section?.class?.name || firstEnrollment?.class?.name || 'Enrolled Class',
          leaving_date: storedInfo.convertedAt || lastEnrollment?.updated_at,
          leaving_reason: storedInfo.remarks || storedInfo.reason || 'Completed studies',
          tc_number: tcNumber,
          tc_issue_date: storedInfo.tcIssueDate,
          character_cert_number: storedInfo.characterCertNumber,
          alumni_cert_number: storedInfo.alumniCertNumber,
          conduct: storedInfo.conduct || 'Exemplary & Commendable',
          remarks: storedInfo.remarks,
          primary_contact: {
            first_name: st.father_name || st.guardian_name || 'Primary Guardian',
            phone: st.guardian_phone || st.emergency_contact_phone,
            email: st.guardian_email,
            relationship: st.guardian_relationship || 'Parent/Guardian',
          },
        });
      }

      return list;
    } catch (e) {
      console.warn('Failed to load alumni students', e);
      return [];
    }
  }

  public async getStudentLifecycleLogs(studentId: string): Promise<{
    student: AlumniStudent | any;
    logs: StudentLifecycleLog[];
    summary: {
      admissionDate: string;
      admissionClass: string;
      admissionSession: string;
      leavingDate: string;
      terminalClass: string;
      graduationSession: string;
      totalSessionsCount: number;
      permanentAdmissionNumber: string;
      alumniNumber: string;
      tcNumber: string;
      conduct: string;
    };
  }> {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context required');

    // 1. Fetch student info
    const { data: st, error: stErr } = await this.supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (stErr || !st) {
      throw new Error('Student record not found');
    }

    // 2. Fetch all academic years for chronology
    const { data: allSessions } = await this.supabase
      .from('academic_years')
      .select('id, name, start_date, end_date, created_at')
      .eq('school_id', schoolId)
      .order('start_date', { ascending: true });

    // 3. Fetch all enrollments for this student
    const { data: enrollments } = await this.supabase
      .from('student_enrollments')
      .select('*, section:sections(*, class:classes(*)), academic_year:academic_years(*)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    // 4. Fetch stored alumni info & certificates
    const alumniStoreKey = `schoolsense_alumni_info_${schoolId || 'default'}`;
    const rawAlumni = localStorage.getItem(alumniStoreKey) || '{}';
    const alumniMap = JSON.parse(rawAlumni);
    const storedInfo = alumniMap[studentId] || {};

    const certStoreKey = `schoolsense_student_certs_${schoolId || 'default'}`;
    const rawCerts = localStorage.getItem(certStoreKey) || '{}';
    const certsMap = JSON.parse(rawCerts);
    const studentCerts: any[] = certsMap[studentId] || [];

    // 5. Fetch any requests
    const { data: requests } = await this.supabase
      .from('student_deactivation_requests')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    // 6. Build timeline logs
    const logs: StudentLifecycleLog[] = [];
    const enrs = enrollments || [];

    // Admission Date & First enrollment
    const firstEnr = enrs[0];
    const lastEnr = enrs[enrs.length - 1];

    const admissionDate = st.admission_date || st.created_at || (firstEnr?.created_at) || new Date().toISOString();
    const admissionClass = firstEnr?.section?.class?.name || firstEnr?.class?.name || storedInfo.admissionClass || 'Enrolled Class';
    const admissionSession = firstEnr?.academic_year?.name || storedInfo.admissionSession || 'Initial Session';

    const terminalClass = storedInfo.graduatingClassName || lastEnr?.section?.class?.name || lastEnr?.class?.name || 'Class 12';
    const terminalSection = storedInfo.graduatingSectionName || lastEnr?.section?.name || 'Section A';
    const graduationSession = storedInfo.sessionName || lastEnr?.academic_year?.name || 'Graduated';

    const cleanAdm = String(st.admission_number || '0000').replace(/[^a-zA-Z0-9]/g, '');
    const gradYear = (graduationSession.match(/\d{4}/) ? graduationSession.match(/\d{4}/)![0] : new Date().getFullYear());
    const alumniNumber = storedInfo.alumniNumber || `ALU-${gradYear}-${cleanAdm.padStart(4, '0')}`;
    const tcNumber = storedInfo.leavingCertificateNumber || storedInfo.tcNumber || `TC/${gradYear}/${cleanAdm.padStart(4, '0')}`;
    const conduct = storedInfo.conduct || 'Exemplary & Commendable';

    // Log 1: Initial Admission
    logs.push({
      id: `adm_${st.id}`,
      student_id: st.id,
      event_type: 'ADMISSION',
      title: 'Institutional Admission & Registration',
      description: `Student formally admitted into ${admissionClass} (${firstEnr?.section?.name || 'Section A'}) with Permanent Admission No. ${st.admission_number}.`,
      academic_session: admissionSession,
      class_name: admissionClass,
      section_name: firstEnr?.section?.name || 'Section A',
      roll_number: firstEnr?.roll_number || st.roll_number || 1,
      status: 'ADMITTED',
      timestamp: admissionDate,
    });

    // Progression Logs for each subsequent enrollment
    for (let i = 0; i < enrs.length; i++) {
      const en = enrs[i];
      const clsName = en.section?.class?.name || en.class?.name || `Grade ${i + 1}`;
      const secName = en.section?.name || 'Section A';
      const sesName = en.academic_year?.name || `Session ${i + 1}`;
      const roll = en.roll_number || 1;

      if (i > 0) {
        const prevEn = enrs[i - 1];
        const prevClsName = prevEn.section?.class?.name || prevEn.class?.name || '';
        
        let title = `Academic Session Progression: ${clsName}`;
        let description = `Enrolled in ${clsName} - ${secName} (Roll No: ${roll}) for Academic Session ${sesName}.`;
        let eventType: StudentLifecycleLog['event_type'] = 'PROMOTION';

        if (prevClsName && prevClsName !== clsName) {
          title = `Annual Academic Promotion to ${clsName}`;
          description = `Successfully completed ${prevClsName} and promoted to ${clsName} (${secName}) with Roll No: ${roll}.`;
        } else if (prevEn.section?.name !== secName) {
          title = `Section Division Transfer to ${secName}`;
          description = `Transferred from ${prevEn.section?.name || 'Section'} to ${secName} in ${clsName}.`;
          eventType = 'SECTION_CHANGE';
        }

        logs.push({
          id: `enr_${en.id || i}`,
          student_id: st.id,
          event_type: eventType,
          title,
          description,
          academic_session: sesName,
          class_name: clsName,
          section_name: secName,
          roll_number: roll,
          status: 'ACTIVE',
          timestamp: en.created_at || en.updated_at || new Date().toISOString(),
        });
      }
    }

    // Deactivation / Academic Requests Approved Logs
    if (requests && requests.length > 0) {
      for (const req of requests) {
        if (req.status === 'APPROVED') {
          logs.push({
            id: `req_${req.id}`,
            student_id: st.id,
            event_type: req.request_type === 'PROMOTION' ? 'PROMOTION' : req.request_type === 'DEMOTION' ? 'DEMOTION' : req.request_type === 'SECTION_CHANGE' ? 'SECTION_CHANGE' : 'STATUS_CHANGE',
            title: `Academic Action Approved: ${req.request_type || 'Status Change'}`,
            description: `Teacher request approved by Administration. Reason: ${req.reason || 'N/A'}. Notes: ${req.review_notes || req.comments || 'N/A'}`,
            academic_session: req.passing_session || graduationSession,
            class_name: req.target_class_name || req.class_name,
            section_name: req.target_section_name || req.section_name,
            roll_number: req.target_roll_number,
            status: req.status,
            performed_by_name: 'School Administration / Principal',
            timestamp: req.reviewed_at || req.created_at,
          });
        }
      }
    }

    // Graduation / Alumni Conversion Log
    logs.push({
      id: `alumni_${st.id}`,
      student_id: st.id,
      event_type: 'ALUMNI_GRADUATION',
      title: `Graduation & Alumni Induction (${terminalClass})`,
      description: `Student successfully completed terminal coursework in ${terminalClass} - ${terminalSection} during Academic Session ${graduationSession}. Inducted into Alumni Register with permanent Alumni ID ${alumniNumber}.`,
      academic_session: graduationSession,
      class_name: terminalClass,
      section_name: terminalSection,
      roll_number: lastEnr?.roll_number || 1,
      status: 'ALUMNI',
      tc_number: tcNumber,
      alumni_number: alumniNumber,
      timestamp: storedInfo.convertedAt || lastEnr?.updated_at || new Date().toISOString(),
    });

    // Certificate Issuance Logs (TC, Character, Alumni)
    if (studentCerts && studentCerts.length > 0) {
      for (const cert of studentCerts) {
        logs.push({
          id: `cert_${cert.id || Math.random()}`,
          student_id: st.id,
          event_type: 'CERTIFICATE_GENERATED',
          title: `Official Document Generated: ${cert.certificate_type}`,
          description: `Issued certificate serial #${cert.certificate_number || cert.serial_number} on ${cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : new Date().toLocaleDateString()}.`,
          academic_session: graduationSession,
          class_name: terminalClass,
          status: 'ISSUED',
          timestamp: cert.created_at || cert.issue_date || new Date().toISOString(),
        });
      }
    }

    // Sort logs chronologically
    logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const studentObj: AlumniStudent = {
      student_id: st.id,
      admission_number: st.admission_number,
      alumni_number: alumniNumber,
      first_name: st.first_name,
      last_name: st.last_name,
      full_name: `${st.first_name || ''} ${st.last_name || ''}`.trim(),
      gender: st.gender,
      date_of_birth: st.date_of_birth,
      dateOfBirth: st.date_of_birth,
      blood_group: st.blood_group,
      status: 'ALUMNI',
      last_class_name: terminalClass,
      last_section_name: terminalSection,
      graduation_session: graduationSession,
      last_roll_number: lastEnr?.roll_number,
      admission_date: admissionDate,
      admission_class_name: admissionClass,
      leaving_date: storedInfo.convertedAt || lastEnr?.updated_at,
      leaving_reason: storedInfo.remarks || storedInfo.reason || 'Completed terminal class studies',
      tc_number: tcNumber,
      tc_issue_date: storedInfo.tcIssueDate,
      character_cert_number: storedInfo.characterCertNumber,
      alumni_cert_number: storedInfo.alumniCertNumber,
      conduct,
      remarks: storedInfo.remarks,
      primary_contact: {
        first_name: st.father_name || st.guardian_name || 'Primary Guardian',
        phone: st.guardian_phone || st.emergency_contact_phone,
        email: st.guardian_email,
        relationship: st.guardian_relationship || 'Parent/Guardian',
      },
    };

    return {
      student: studentObj,
      logs,
      summary: {
        admissionDate,
        admissionClass,
        admissionSession,
        leavingDate: storedInfo.convertedAt || lastEnr?.updated_at || new Date().toISOString(),
        terminalClass,
        graduationSession,
        totalSessionsCount: Math.max(1, enrs.length),
        permanentAdmissionNumber: st.admission_number,
        alumniNumber,
        tcNumber,
        conduct,
      },
    };
  }

  public async recordStudentCertificate(body: any): Promise<any> {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');
    const studentId = body.studentId || body.student_id;
    if (!studentId) throw new Error('Student ID required');

    const certStoreKey = `schoolsense_student_certs_${schoolId || 'default'}`;
    const rawCerts = localStorage.getItem(certStoreKey) || '{}';
    const certsMap = JSON.parse(rawCerts);
    if (!certsMap[studentId]) certsMap[studentId] = [];

    const newCert = {
      id: `cert_${Date.now()}`,
      certificate_type: body.certificate_type || body.type || 'Transfer Certificate',
      certificate_number: body.certificate_number || body.serial_number || `CERT-${Date.now()}`,
      issue_date: body.issue_date || new Date().toISOString(),
      conduct: body.conduct || 'Exemplary',
      reason_for_leaving: body.reason_for_leaving || body.reason,
      created_at: new Date().toISOString(),
      metadata: body,
    };

    certsMap[studentId].push(newCert);
    localStorage.setItem(certStoreKey, JSON.stringify(certsMap));

    // Also update schoolsense_alumni_info
    const alumniStoreKey = `schoolsense_alumni_info_${schoolId || 'default'}`;
    const rawAlumni = localStorage.getItem(alumniStoreKey) || '{}';
    const alumniMap = JSON.parse(rawAlumni);
    if (!alumniMap[studentId]) alumniMap[studentId] = {};

    if (body.certificate_type === 'TRANSFER_CERTIFICATE' || body.type === 'TRANSFER_CERTIFICATE') {
      alumniMap[studentId].leavingCertificateNumber = newCert.certificate_number;
      alumniMap[studentId].tcNumber = newCert.certificate_number;
      alumniMap[studentId].tcIssueDate = newCert.issue_date;
    } else if (body.certificate_type === 'CHARACTER_CERTIFICATE' || body.type === 'CHARACTER_CERTIFICATE') {
      alumniMap[studentId].characterCertNumber = newCert.certificate_number;
      alumniMap[studentId].conduct = body.conduct || alumniMap[studentId].conduct;
    } else if (body.certificate_type === 'ALUMNI_CERTIFICATE' || body.type === 'ALUMNI_CERTIFICATE') {
      alumniMap[studentId].alumniCertNumber = newCert.certificate_number;
      if (body.alumni_number) alumniMap[studentId].alumniNumber = body.alumni_number;
    }
    localStorage.setItem(alumniStoreKey, JSON.stringify(alumniMap));

    return {
      success: true,
      message: 'Certificate recorded successfully.',
      certificate: newCert,
    };
  }

  private async createAlumniStudent(body: any): Promise<any> {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    let admissionNumber = (body.admissionNumber || body.admission_number || '').trim();
    const firstName = (body.firstName || body.first_name || '').trim();
    const lastName = (body.lastName || body.last_name || '').trim();
    const guardianName = (body.guardianName || body.emergencyContactName || body.primaryContact?.first_name || '').trim();
    const guardianPhone = (body.guardianPhone || body.emergencyContactPhone || body.primaryContact?.phone || '').trim();

    if (!admissionNumber) {
      const nextInfo = await this.getNextAdmissionNumber(schoolId);
      admissionNumber = nextInfo.admissionNumber;
    }

    let dob: string | null = null;
    if (body.dateOfBirth || body.date_of_birth) {
      try {
        dob = new Date(body.dateOfBirth || body.date_of_birth).toISOString().split('T')[0];
      } catch {
        dob = null;
      }
    }

    // 1. Create student record with ALUMNI status
    const { data: student, error: sErr } = await this.supabase
      .from('students')
      .insert({
        school_id: schoolId,
        admission_number: admissionNumber,
        first_name: firstName,
        last_name: lastName || null,
        gender: body.gender || 'MALE',
        date_of_birth: dob,
        emergency_contact_name: guardianName || null,
        emergency_contact_phone: guardianPhone || null,
        status: 'ALUMNI',
      })
      .select()
      .single();

    if (sErr) throw sErr;

    // 2. Resolve terminal class & section & graduation session
    let targetClassId = body.classId || body.class_id;
    let targetSectionId = body.sectionId || body.section_id;
    let graduationSessionId = body.academicYearId || body.academic_year_id;

    if (!targetClassId) {
      const { data: classes } = await this.supabase
        .from('classes')
        .select('id, name, sections(id, name)')
        .eq('school_id', schoolId)
        .order('display_order', { ascending: false });
      if (classes && classes.length > 0) {
        targetClassId = classes[0].id;
        if (!targetSectionId && classes[0].sections && classes[0].sections.length > 0) {
          targetSectionId = classes[0].sections[0].id;
        }
      }
    }

    if (!targetSectionId && targetClassId) {
      const { data: sec } = await this.supabase
        .from('sections')
        .select('id')
        .eq('class_id', targetClassId)
        .limit(1)
        .maybeSingle();
      if (sec) targetSectionId = sec.id;
    }

    if (!graduationSessionId) {
      const { data: ses } = await this.supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ses) graduationSessionId = ses.id;
    }

    if (student?.id && targetSectionId && graduationSessionId) {
      try {
        await this.supabase.from('student_enrollments').insert({
          student_id: student.id,
          class_id: targetClassId,
          section_id: targetSectionId,
          academic_year_id: graduationSessionId,
          roll_number: body.rollNumber || '1',
          status: 'ALUMNI',
        });
      } catch (enrErr) {
        console.warn('Alumni enrollment note:', enrErr);
      }
    }

    return { success: true, student_id: student.id, student };
  }

  private async updateAlumniStudent(studentId: string, body: any): Promise<any> {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    const updatePayload: any = {};
    if (body.firstName || body.first_name) updatePayload.first_name = (body.firstName || body.first_name).trim();
    if (body.lastName !== undefined || body.last_name !== undefined) updatePayload.last_name = (body.lastName || body.last_name || '').trim() || null;
    if (body.gender) updatePayload.gender = body.gender;
    if (body.guardianName || body.emergencyContactName || body.primaryContact?.first_name) {
      updatePayload.emergency_contact_name = (body.guardianName || body.emergencyContactName || body.primaryContact?.first_name).trim();
    }
    if (body.guardianPhone || body.emergencyContactPhone || body.primaryContact?.phone) {
      updatePayload.emergency_contact_phone = (body.guardianPhone || body.emergencyContactPhone || body.primaryContact?.phone).trim();
    }
    if (body.dateOfBirth || body.date_of_birth) {
      try {
        updatePayload.date_of_birth = new Date(body.dateOfBirth || body.date_of_birth).toISOString().split('T')[0];
      } catch {}
    }

    if (Object.keys(updatePayload).length > 0) {
      await this.supabase.from('students').update(updatePayload).eq('id', studentId).eq('school_id', schoolId);
    }

    if (body.classId || body.sectionId || body.academicYearId) {
      const enrUpdate: any = {};
      if (body.classId) enrUpdate.class_id = body.classId;
      if (body.sectionId) enrUpdate.section_id = body.sectionId;
      if (body.academicYearId) enrUpdate.academic_year_id = body.academicYearId;
      try {
        await this.supabase.from('student_enrollments').update(enrUpdate).eq('student_id', studentId);
      } catch {}
    }

    return { success: true };
  }

  private async deleteAlumniStudent(studentId: string): Promise<any> {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    try {
      await this.supabase.from('student_enrollments').delete().eq('student_id', studentId);
    } catch {}

    const { error } = await this.supabase
      .from('students')
      .delete()
      .eq('id', studentId)
      .eq('school_id', schoolId);

    if (error) throw error;
    return { success: true };
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

  private async resetAllStudentsAndSessions(): Promise<any> {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    // 1. Delete dependent transactional records
    try {
      await this.supabase.from('student_enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.warn('Reset enrollments note:', e);
    }

    try {
      await this.supabase.from('attendance').delete().eq('school_id', schoolId);
    } catch (e) {}

    try {
      await this.supabase.from('student_deactivation_requests').delete().eq('school_id', schoolId);
    } catch (e) {}

    try {
      await this.supabase.from('exam_marks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {}

    try {
      await this.supabase.from('homework_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {}

    // 2. Delete all students
    try {
      await this.supabase.from('students').delete().eq('school_id', schoolId);
    } catch (e) {
      console.warn('Reset students note:', e);
    }

    // 3. Delete all academic sessions
    try {
      await this.supabase.from('academic_years').delete().eq('school_id', schoolId);
    } catch (e) {
      console.warn('Reset academic_years note:', e);
    }

    // 4. Create single clean base session (2026–2027)
    let newBaseSession: any = null;
    try {
      const { data: created } = await this.supabase
        .from('academic_years')
        .insert({
          school_id: schoolId,
          name: '2026–2027',
          start_date: '2026-04-01',
          end_date: '2027-03-31',
          is_current: true,
          status: 'ACTIVE',
        })
        .select()
        .single();
      newBaseSession = created;
    } catch (e) {
      console.warn('Create base session note:', e);
    }

    // 5. Re-provision Section A for all classes for the new session
    try {
      const { data: classes } = await this.supabase
        .from('classes')
        .select('id')
        .eq('school_id', schoolId);

      if (classes && classes.length > 0 && newBaseSession?.id) {
        // Clear old session sections
        await this.supabase.from('sections').delete().eq('school_id', schoolId);

        const newSections = classes.map((c: any) => ({
          school_id: schoolId,
          class_id: c.id,
          academic_year_id: newBaseSession.id,
          name: 'Section A',
          code: 'A',
          capacity: 40,
          display_order: 1,
          status: 'ACTIVE',
        }));
        await this.supabase.from('sections').insert(newSections);
      }
    } catch (e) {
      console.warn('Re-provision sections note:', e);
    }

    // 6. Clear local storage caches
    try {
      localStorage.removeItem('schoolsense_student_sections');
      localStorage.removeItem('schoolsense_student_section_map');
      localStorage.removeItem('schoolsense_student_statuses');
      localStorage.removeItem('schoolsense_student_profiles');
      localStorage.removeItem('schoolsense_student_logs');
      localStorage.removeItem('schoolsense_last_enrollments');
      // Clear session-specific section maps
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('schoolsense_student_sections_')) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {}

    return {
      success: true,
      message: 'All students and sessions reset successfully.',
      session: newBaseSession,
    };
  }

  // ============================================================================
  // Student Enrollment Handler & Next Admission Number Generator
  // ============================================================================

  public async getNextAdmissionNumber(targetSchoolId?: string): Promise<{ admissionNumber: string; sequence: number }> {
    const schoolId = targetSchoolId || this.getSchoolId();
    let schoolName = '';
    const user = this.getCurrentUser();
    if (user?.school?.name) schoolName = user.school.name;
    else if (user?.school_name) schoolName = user.school_name;

    if (!schoolName && schoolId) {
      try {
        const { data: sch } = await this.supabase.from('schools').select('name').eq('id', schoolId).maybeSingle();
        if (sch?.name) schoolName = sch.name;
      } catch {}
    }

    const cleanLetters = (schoolName || 'DEL').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    let schoolPrefix = (cleanLetters.slice(0, 3) || 'DEL').padEnd(3, 'D');
    const yr = new Date().getFullYear();

    const existingAdmissionNumbers = new Set<string>();
    let maxSerial = 0;

    if (schoolId) {
      try {
        const { data: allSts } = await this.supabase
          .from('students')
          .select('id, admission_number')
          .eq('school_id', schoolId);

        (allSts || []).forEach((st: any) => {
          if (st.admission_number) {
            const raw = String(st.admission_number).trim().toUpperCase();
            const normalized = raw.replace(/[\u2013\u2014\u2212]/g, '-').replace(/\s+/g, '');
            existingAdmissionNumbers.add(raw);
            existingAdmissionNumbers.add(normalized);

            // Match pattern ADM-XXX-YYYY-ZZZZ (e.g. ADM-DEL-2026-0001 -> 1)
            const pfxMatch = normalized.match(/^ADM-([A-Z0-9]{2,6})-\d{4}-(\d+)$/i);
            if (pfxMatch) {
              if (pfxMatch[1]) schoolPrefix = pfxMatch[1].toUpperCase();
              if (pfxMatch[2]) {
                const num = parseInt(pfxMatch[2], 10);
                if (!isNaN(num) && num > maxSerial) {
                  maxSerial = num;
                }
              }
            } else {
              const genericMatch = normalized.match(/-(\d{1,5})$/);
              if (genericMatch && genericMatch[1]) {
                const num = parseInt(genericMatch[1], 10);
                if (!isNaN(num) && num > maxSerial) {
                  maxSerial = num;
                }
              }
            }
          }
        });

        if (allSts && allSts.length > maxSerial) {
          maxSerial = allSts.length;
        }
      } catch (e) {
        console.warn('Query students for next admission number note:', e);
      }
    }

    let candidateSerial = Math.max(1, maxSerial + 1);
    let candidateAdmissionNumber = `ADM-${schoolPrefix}-${yr}-${String(candidateSerial).padStart(4, '0')}`;

    while (
      existingAdmissionNumbers.has(candidateAdmissionNumber.toUpperCase()) ||
      existingAdmissionNumbers.has(candidateAdmissionNumber.replace(/-/g, '–').toUpperCase())
    ) {
      candidateSerial++;
      candidateAdmissionNumber = `ADM-${schoolPrefix}-${yr}-${String(candidateSerial).padStart(4, '0')}`;
    }

    return {
      admissionNumber: candidateAdmissionNumber,
      sequence: candidateSerial,
    };
  }

  private async createStudent(body: any): Promise<any> {
    const schoolId = this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    let admissionNumber = (body.admissionNumber || '').trim();
    const firstName = (body.firstName || '').trim();
    const lastName = (body.lastName || '').trim();
    const guardianName = (body.guardianName || body.emergencyContactName || '').trim();
    const guardianPhone = (body.guardianPhone || body.emergencyContactPhone || '').trim();

    // Auto-generate if empty or format with guaranteed unique pattern
    if (!admissionNumber) {
      const nextInfo = await this.getNextAdmissionNumber(schoolId);
      admissionNumber = nextInfo.admissionNumber;
    } else {
      // Check if admission number already exists for this school to prevent duplicate collision
      try {
        const { data: existingStudent } = await this.supabase
          .from('students')
          .select('id, admission_number')
          .eq('school_id', schoolId)
          .eq('admission_number', admissionNumber)
          .maybeSingle();

        if (existingStudent) {
          const nextInfo = await this.getNextAdmissionNumber(schoolId);
          admissionNumber = nextInfo.admissionNumber;
        }
      } catch {}
    }

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

    const studentPhoto = body.photoUrl || body.photo_url || null;
    const guardianPhoto = body.guardianPhotoUrl || body.guardian_photo_url || null;

    let insertPayload: any = {
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
    };

    if (studentPhoto) {
      insertPayload.photo_url = studentPhoto;
    }
    if (guardianPhoto) {
      insertPayload.guardian_photo_url = guardianPhoto;
    }

    let { data: student, error: sErr } = await this.supabase
      .from('students')
      .insert(insertPayload)
      .select()
      .single();

    if (sErr && (sErr.code === 'PGRST204' || sErr.message?.includes('column') || sErr.message?.includes('schema cache'))) {
      delete insertPayload.photo_url;
      delete insertPayload.guardian_photo_url;
      const res = await this.supabase
        .from('students')
        .insert(insertPayload)
        .select()
        .single();
      student = res.data;
      sErr = res.error;
    }

    if (sErr) throw sErr;

    if (student?.id && (studentPhoto || guardianPhoto)) {
      try {
        const photosMap = JSON.parse(localStorage.getItem('schoolsense_student_photos') || '{}');
        photosMap[student.id] = {
          photoUrl: studentPhoto || '',
          photo_url: studentPhoto || '',
          guardianPhotoUrl: guardianPhoto || '',
          guardian_photo_url: guardianPhoto || '',
        };
        localStorage.setItem('schoolsense_student_photos', JSON.stringify(photosMap));
      } catch {}
    }

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

    this.setStudentSection(
      student.id,
      {
        classId: targetClassId,
        className: resolvedClassName,
        sectionId: targetSectionId || body.sectionId,
        sectionName: resolvedSectionName,
        rollNumber: body.rollNumber ? String(body.rollNumber) : '1',
      },
      academicYearId
    );

    if (academicYearId && targetSectionId) {
      try {
        await this.supabase.from('student_enrollments').insert({
          student_id: student.id,
          section_id: targetSectionId,
          class_id: targetClassId || null,
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

  private async getSubscriptionDetails(targetSchoolId?: string, academicYearId?: string): Promise<any> {
    const schoolId = targetSchoolId || this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    // SaaS Subscription is ALWAYS calculated on the single official current session (is_current: true)
    const calc = await this.calculateMonthlySubscription(schoolId);
    let subData: any = null;
    let walletData: any = null;
    let txnsList: any[] = [];

    try {
      const [subRes, walletRes, txnsRes] = await Promise.all([
        this.supabase.from('school_subscriptions').select('*').eq('school_id', schoolId).maybeSingle() as any,
        this.supabase.from('school_wallets').select('*').eq('school_id', schoolId).maybeSingle() as any,
        this.supabase.from('wallet_transactions').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(25) as any,
      ]);
      if (subRes?.data) subData = subRes.data;
      if (walletRes?.data) walletData = walletRes.data;
      if (txnsRes?.data && Array.isArray(txnsRes.data)) txnsList = txnsRes.data;
    } catch (e) {
      console.warn('Subscription details direct query note:', e);
    }

    const localSubs = this.getLocalSubscriptions();
    const localWallets = this.getLocalWallets();
    const localTxns = this.getLocalWalletTransactions(schoolId);

    const activeStudents = calc.total_students;
    const rate = calc.per_student_rate;
    const estimatedMonthlyFee = calc.total_calculated_fee;

    const currentWallet = walletData || localWallets[schoolId] || { balance: 0.00 };
    const currentSub = subData || localSubs[schoolId] || {
      plan_tier: 'PRO',
      status: 'ACTIVE',
      per_student_fee: rate,
      currency: 'INR',
    };

    return {
      school_id: schoolId,
      academic_year_id: calc.academic_year_id,
      current_session_name: calc.current_session_name,
      active_students: activeStudents,
      estimated_monthly_fee: estimatedMonthlyFee,
      subscription: {
        id: currentSub.id || 'sub-default',
        school_id: schoolId,
        plan_tier: currentSub.plan_tier || 'PRO',
        status: currentSub.status || 'ACTIVE',
        per_student_fee: rate,
        currency: currentSub.currency || 'INR',
        billing_cycle: currentSub.billing_cycle || 'MONTHLY',
        next_billing_date: currentSub.next_billing_date || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15).toISOString(),
        is_auto_debit: currentSub.is_auto_debit ?? true,
      },
      wallet: {
        id: currentWallet.id || 'wallet-default',
        school_id: schoolId,
        balance: Number(currentWallet.balance || 0),
        currency: currentWallet.currency || 'INR',
        credit_limit: Number(currentWallet.credit_limit || 5000.00),
        status: currentWallet.status || 'ACTIVE',
      },
      recent_transactions: (txnsList && txnsList.length > 0 ? txnsList : localTxns).slice(0, 10),
    };
  }

  private async calculateMonthlySubscription(targetSchoolId?: string, academicYearId?: string): Promise<any> {
    const schoolId = targetSchoolId || this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    // Always find the school's official single CURRENT session (is_current: true)
    let currentSessionId = '';
    let currentSessionName = '';
    try {
      const { data: currentYears } = await this.supabase
        .from('academic_years')
        .select('id, name')
        .eq('school_id', schoolId)
        .eq('is_current', true)
        .limit(1);

      if (currentYears && currentYears.length > 0) {
        currentSessionId = currentYears[0].id;
        currentSessionName = currentYears[0].name;
      }
    } catch {}

    if (!currentSessionId) {
      currentSessionId = (await this.getActiveAcademicYearId(schoolId)) || '';
    }

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

    const localStatusMap = (() => {
      try {
        return JSON.parse(localStorage.getItem('schoolsense_student_statuses') || '{}');
      } catch {
        return {};
      }
    })();

    let enrollments: any[] = [];
    if (currentSessionId) {
      try {
        const { data: enrollData } = await this.supabase
          .from('student_enrollments')
          .select('*, student:students(*), section:sections(*, class:classes(*))')
          .eq('academic_year_id', currentSessionId);
        if (enrollData && enrollData.length > 0) {
          enrollments = enrollData;
        }
      } catch (e) {
        console.warn('Query student_enrollments in calculateMonthlySubscription failed:', e);
      }
    }

    // Fallback ONLY if 0 enrollments exist globally across all sessions (initial bootstrap)
    if (enrollments.length === 0) {
      try {
        const { count: globalEnrCount } = await this.supabase
          .from('student_enrollments')
          .select('id', { count: 'exact', head: true });

        if (!globalEnrCount || globalEnrCount === 0) {
          const secMap = this.getStudentSectionMap(currentSessionId);
          const { data: students } = await this.supabase
            .from('students')
            .select('*')
            .eq('school_id', schoolId)
            .neq('status', 'ALUMNI')
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
    let totalCalculatedFee = 0;
    const breakdown = (enrollments || [])
      .filter((e: any) => e.student && e.student?.status !== 'ALUMNI')
      .map((e: any) => {
        const st = e.student || {};
        const className = e.section?.class?.name || e.class?.name || 'Class 1';
        const sectionName = e.section?.name || 'Section A';

        const rawStatus = localStatusMap[st.id]?.status || localStatusMap[e.id]?.status || (e.student_id ? localStatusMap[e.student_id]?.status : null) || e.status || st.status || 'ACTIVE';
        const stStatus = String(rawStatus).toUpperCase();

        const activeInfo = this.getStudentActiveTimeInfo(st.id || e.id, e.created_at || st.created_at, stStatus);

        let studentFee = 0;
        let billingNote = '';

        if (stStatus === 'SUSPENDED') {
          studentFee = rate;
          billingNote = `Full Month (SUSPENDED - Disciplinary Action / Seat Held)`;
        } else if (stStatus === 'INACTIVE' || stStatus === 'ALUMNI') {
          studentFee = 0.00;
          billingNote = `Exempt (${stStatus} student)`;
        } else if (activeInfo.isBillable) {
          studentFee = rate;
          billingNote = activeInfo.activeHours >= 72
            ? `Full Month (Active: ${activeInfo.activeTimeFormatted} ≥ 72h / 3 days)`
            : `Full Month (Active in cycle ≥ 3 days / 72h)`;
        } else {
          studentFee = 0.00;
          billingNote = `Exempt (Late enrollment, ${activeInfo.activeTimeFormatted} < 3 days / 72h active)`;
        }

        if (studentFee > 0) {
          totalCalculatedFee += studentFee;
        }

        return {
          student_id: st.id,
          admission_number: st.admission_number || '',
          student_name: `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.admission_number || 'Student',
          enrollment_date: (e.created_at || st.created_at)?.split('T')[0] || now.toISOString().split('T')[0],
          status: stStatus,
          active_hours: activeInfo.activeHours,
          active_time_formatted: activeInfo.activeTimeFormatted,
          is_billable: studentFee > 0,
          class_name: className,
          section_name: sectionName,
          student_fee: studentFee,
          billing_note: billingNote,
        };
      });

    const billableStudents = breakdown.filter((s: any) => s.student_fee > 0);

    return {
      school_id: schoolId,
      academic_year_id: currentSessionId,
      current_session_name: currentSessionName || 'Current Session',
      per_student_rate: rate,
      total_students: billableStudents.length,
      all_students_count: breakdown.length,
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

  // =========================================================================
  // SCHOOL PROFILE MANAGEMENT
  // =========================================================================
  public async getSchoolProfile(schoolId?: string): Promise<any> {
    const sId = schoolId || this.getSchoolId();
    if (!sId) return null;

    let schoolData: any = null;

    // 1. Fetch from Supabase
    try {
      const { data, error } = await this.supabase
        .from('schools')
        .select('*')
        .eq('id', sId)
        .maybeSingle();
      if (!error && data) {
        schoolData = data;
      }
    } catch (e) {
      console.warn('Error fetching school profile from Supabase', e);
    }

    // 2. Read any local storage cache override
    try {
      const localProfiles = JSON.parse(localStorage.getItem('schoolsense_school_profiles') || '{}');
      if (localProfiles[sId]) {
        schoolData = { ...(schoolData || {}), ...localProfiles[sId] };
      }
    } catch (e) {}

    // 3. Fallback from current user's school object if nothing found
    if (!schoolData) {
      const user = this.getCurrentUser();
      if (user?.school && user.school.id === sId) {
        schoolData = {
          id: user.school.id,
          name: user.school.name,
          code: user.school.code,
          status: user.school.status || 'ACTIVE',
        };
      }
    }

    return schoolData;
  }

  public async updateSchoolProfile(schoolId: string, profileData: any): Promise<any> {
    const sId = schoolId || this.getSchoolId();
    if (!sId) throw new Error('No school ID specified.');

    const logo = profileData.logo_url || profileData.logoUrl || null;
    const updatePayload = {
      name: profileData.name?.trim(),
      code: profileData.code?.trim(),
      email: profileData.email?.trim() || null,
      phone: profileData.phone?.trim() || null,
      logo_url: logo,
      address_line1: profileData.address_line1?.trim() || profileData.addressLine1?.trim() || null,
      city: profileData.city?.trim() || null,
      state: profileData.state?.trim() || null,
      country: profileData.country?.trim() || 'India',
      postal_code: profileData.postal_code?.trim() || profileData.postalCode?.trim() || null,
      status: profileData.status || 'ACTIVE',
    };

    // 1. Update in Supabase
    try {
      await this.supabase
        .from('schools')
        .update(updatePayload)
        .eq('id', sId);
    } catch (e) {
      console.warn('Could not update school in Supabase directly', e);
    }

    // 2. Update local storage overrides & sync active user state
    try {
      const localProfiles = JSON.parse(localStorage.getItem('schoolsense_school_profiles') || '{}');
      localProfiles[sId] = { ...(localProfiles[sId] || {}), ...updatePayload, ...profileData, logoUrl: logo, logo_url: logo, id: sId };
      localStorage.setItem('schoolsense_school_profiles', JSON.stringify(localProfiles));

      // Sync user in localStorage if user belongs to this school
      const userRaw = localStorage.getItem('schoolsense_user');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u?.school && u.school.id === sId) {
          u.school.name = updatePayload.name || u.school.name;
          u.school.code = updatePayload.code || u.school.code;
          u.school.logoUrl = logo || u.school.logoUrl;
          localStorage.setItem('schoolsense_user', JSON.stringify(u));
        }
      }
    } catch (e) {}

    return { success: true, school: { ...profileData, id: sId, ...updatePayload, logoUrl: logo } };
  }

  // =========================================================================
  // ROLE & SERVICE PERMISSION MANAGEMENT
  // =========================================================================
  public async getRolePermissions(schoolId?: string): Promise<Record<string, string[]>> {
    const sId = schoolId || this.getSchoolId();
    const defaultPerms: Record<string, string[]> = {
      SUPER_ADMIN: [
        'dashboard', 'academics', 'academics_classes', 'academics_students', 'academics_alumni', 'academics_staff', 'academics_subjects',
        'timetable', 'timetable_student', 'timetable_faculty', 'attendance', 'homework', 'exams', 'communication', 'communication_notices', 'communication_complaints', 'subscription'
      ],
      SCHOOL_ADMIN: [
        'dashboard', 'academics', 'academics_classes', 'academics_students', 'academics_alumni', 'academics_staff', 'academics_subjects',
        'timetable', 'timetable_student', 'timetable_faculty', 'attendance', 'homework', 'exams', 'communication', 'communication_notices', 'communication_complaints', 'subscription'
      ],
      PRINCIPAL: [
        'dashboard', 'academics', 'academics_classes', 'academics_students', 'academics_alumni', 'academics_staff', 'academics_subjects',
        'timetable', 'timetable_student', 'timetable_faculty', 'attendance', 'homework', 'exams', 'communication', 'communication_notices', 'communication_complaints', 'subscription'
      ],
      CLASS_TEACHER: [
        'dashboard', 'academics', 'academics_classes', 'academics_students', 'academics_alumni', 'academics_subjects',
        'timetable', 'timetable_student', 'timetable_faculty', 'attendance', 'homework', 'exams', 'communication', 'communication_notices', 'communication_complaints'
      ],
      TEACHER: [
        'dashboard', 'academics', 'academics_subjects',
        'timetable', 'timetable_student', 'timetable_faculty', 'attendance', 'homework', 'exams', 'communication', 'communication_notices', 'communication_complaints'
      ],
      FEE_MANAGER: [
        'dashboard', 'academics', 'academics_students', 'academics_alumni', 'communication', 'communication_notices', 'subscription'
      ],
      GUARDIAN: [
        'dashboard', 'timetable', 'timetable_student', 'attendance', 'homework', 'exams', 'communication', 'communication_notices', 'communication_complaints'
      ],
      PARENT: [
        'dashboard', 'timetable', 'timetable_student', 'attendance', 'homework', 'exams', 'communication', 'communication_notices', 'communication_complaints'
      ],
      STUDENT: [
        'dashboard', 'timetable', 'timetable_student', 'attendance', 'homework', 'exams', 'communication', 'communication_notices'
      ],
    };

    try {
      const key = `schoolsense_role_perms_${sId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return { ...defaultPerms, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to parse role permissions from local storage', e);
    }

    return defaultPerms;
  }

  public async updateRolePermissions(schoolId: string, permissions: Record<string, string[]>): Promise<any> {
    const sId = schoolId || this.getSchoolId();
    if (!sId) throw new Error('No school ID specified.');

    try {
      const key = `schoolsense_role_perms_${sId}`;
      localStorage.setItem(key, JSON.stringify(permissions));
    } catch (e) {
      console.warn('Failed to save role permissions to local storage', e);
    }

    return { success: true, permissions };
  }
}
