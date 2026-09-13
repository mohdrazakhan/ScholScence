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
    const raw = localStorage.getItem('schoolsense_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        return u?.id || '';
      } catch {}
    }
    return '';
  }

  get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    const cleanEndpoint = endpoint.split('?')[0];

    // Dashboard Overview
    if (cleanEndpoint === 'dashboard/overview' || cleanEndpoint === 'dashboard') {
      return from(this.getDashboardOverview()) as unknown as Observable<T>;
    }

    // SaaS Subscription & Wallet Overview
    if (cleanEndpoint === 'subscription/overview' || cleanEndpoint === 'subscription') {
      const targetSchoolId = params?.['schoolId'] || this.getSchoolId();
      return from(this.getSubscriptionDetails(targetSchoolId)) as unknown as Observable<T>;
    }

    // SaaS Monthly Calculation & Proration Roster
    if (cleanEndpoint === 'subscription/calculate') {
      const targetSchoolId = params?.['schoolId'] || this.getSchoolId();
      return from(this.calculateMonthlySubscription(targetSchoolId)) as unknown as Observable<T>;
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

    // Academics: Section Students
    const sectionStudentsMatch = cleanEndpoint.match(/^academics\/sections\/(.+)\/students$/);
    if (sectionStudentsMatch) {
      return from(this.getSectionStudents(sectionStudentsMatch[1])) as unknown as Observable<T>;
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

    // Create Class / Section
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

    // Create Student
    if (cleanEndpoint === 'academics/students') {
      return from(this.createStudent(body)) as unknown as Observable<T>;
    }

    // SaaS Subscription & Wallet Actions
    if (cleanEndpoint === 'subscription/wallet/top-up' || cleanEndpoint === 'wallet/top-up') {
      return from(this.topUpWallet(body)) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'subscription/billing/run' || cleanEndpoint === 'subscription/bill') {
      return from(this.executeMonthlyBilling(body)) as unknown as Observable<T>;
    }
    if (cleanEndpoint === 'subscription/rate' || cleanEndpoint === 'subscription/rate/update') {
      return from(this.updateSubscriptionRate(body)) as unknown as Observable<T>;
    }

    return of({ success: true, ...body } as unknown as T);
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    const cleanEndpoint = endpoint.split('?')[0];

    if (cleanEndpoint.startsWith('complaints/') && cleanEndpoint.endsWith('/status')) {
      const ticketId = cleanEndpoint.split('/')[1];
      return from(this.updateComplaintStatus(ticketId, body.status)) as unknown as Observable<T>;
    }

    return of({ success: true, ...body } as unknown as T);
  }

  delete<T>(endpoint: string): Observable<T> {
    const cleanEndpoint = endpoint.split('?')[0];

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

  // ============================================================================
  // Supabase Implementation Handlers
  // ============================================================================

  private async getDashboardOverview(): Promise<DashboardStats> {
    const schoolId = this.getSchoolId();

    let studentCount = 0;
    let classCount = 0;
    let teacherCount = 0;
    let complaintsCount = 0;

    if (schoolId) {
      const [sRes, cRes, tRes, compRes] = await Promise.all([
        this.supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        this.supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        this.supabase.from('user_school_roles').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        this.supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'OPEN'),
      ]);

      studentCount = sRes.count || 0;
      classCount = cRes.count || 0;
      teacherCount = tRes.count || 0;
      complaintsCount = compRes.count || 0;
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

    return {
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
  }

  private async getClasses(academicYearId?: string): Promise<ClassItem[]> {
    const schoolId = this.getSchoolId();
    let query = this.supabase.from('classes').select('*, sections(*)').order('display_order');
    if (schoolId) query = query.eq('school_id', schoolId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      display_order: c.display_order,
      sections: (c.sections || [])
        .filter((s: any) => !academicYearId || !s.academic_year_id || s.academic_year_id === academicYearId)
        .map((s: any) => ({
          id: s.id,
          class_id: s.class_id,
          academic_year_id: s.academic_year_id,
          name: s.name,
          code: s.code,
          capacity: s.capacity || 40,
          display_order: s.display_order || 0,
        })),
    }));
  }

  private async getSubjects(): Promise<SubjectItem[]> {
    const schoolId = this.getSchoolId();
    let query = this.supabase.from('subjects').select('*').order('name');
    if (schoolId) query = query.eq('school_id', schoolId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      subject_type: s.type || 'THEORY',
      display_order: 0,
    }));
  }

  private async getStaff(): Promise<any[]> {
    const schoolId = this.getSchoolId();
    let query = this.supabase
      .from('user_school_roles')
      .select('*, user:users(*), role:roles(*)')
      .eq('status', 'ACTIVE');
    if (schoolId) query = query.eq('school_id', schoolId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((usr: any) => ({
      id: usr.user?.id,
      name: `${usr.user?.first_name || ''} ${usr.user?.last_name || ''}`.trim(),
      first_name: usr.user?.first_name,
      last_name: usr.user?.last_name,
      email: usr.user?.email,
      phone: usr.user?.phone,
      role: usr.role?.name || 'Staff',
      roleCode: usr.role?.code,
    }));
  }

  private async getSectionStudents(sectionId: string): Promise<StudentItem[]> {
    const { data, error } = await this.supabase
      .from('student_enrollments')
      .select('*, student:students(*)')
      .eq('section_id', sectionId);
    if (error) throw error;
    return (data || []).map((e: any) => ({
      enrollmentId: e.id,
      studentId: e.student?.id,
      admissionNumber: e.student?.admission_number || '',
      firstName: e.student?.first_name || '',
      lastName: e.student?.last_name || '',
      fullName: `${e.student?.first_name || ''} ${e.student?.last_name || ''}`.trim(),
      rollNumber: Number(e.roll_number) || 1,
      gender: e.student?.gender,
      className: '',
      sectionName: '',
    }));
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

  private async getMyChildren(): Promise<any[]> {
    return [];
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

  private async createSubject(body: any) {
    const schoolId = this.getSchoolId();
    const { data, error } = await this.supabase
      .from('subjects')
      .insert({
        school_id: schoolId,
        name: body.name,
        code: body.code.toUpperCase(),
        type: body.subject_type || 'THEORY',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  private async deleteSubject(id: string) {
    const { error } = await this.supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  }

  private async createClass(body: any) {
    const schoolId = this.getSchoolId();
    const { data, error } = await this.supabase
      .from('classes')
      .insert({
        school_id: schoolId,
        name: body.name,
        code: body.code.toUpperCase(),
        display_order: body.display_order || 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  private async createSection(body: any) {
    const schoolId = this.getSchoolId();
    const { data, error } = await this.supabase
      .from('sections')
      .insert({
        school_id: schoolId,
        class_id: body.class_id,
        academic_year_id: body.academic_year_id,
        name: body.name,
        code: body.code.toUpperCase(),
        capacity: body.capacity || 40,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
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

    // Direct student promotion logic:
    // 1. Fetch current enrollments with class & section
    const { data: enrollments, error: eErr } = await this.supabase
      .from('student_enrollments')
      .select('*, class:classes(*), section:sections(*)')
      .eq('academic_year_id', fromSessionId);

    if (eErr) throw eErr;

    // 2. Fetch all classes for progression ordering
    const { data: allClasses } = await this.supabase
      .from('classes')
      .select('*, sections(*)')
      .eq('school_id', schoolId)
      .order('display_order', { ascending: true });

    const classList = allClasses || [];
    let promotedCount = 0;
    let graduatedCount = 0;

    for (const e of (enrollments || [])) {
      const currentClassIdx = classList.findIndex((c: any) => c.id === e.class_id);
      if (currentClassIdx !== -1 && currentClassIdx < classList.length - 1) {
        // Move to next class
        const nextClass = classList[currentClassIdx + 1];
        const nextSection = (nextClass.sections || [])[0] || e.section;
        if (nextSection) {
          await this.supabase.from('student_enrollments').insert({
            student_id: e.student_id,
            section_id: nextSection.id,
            academic_year_id: toSessionId,
            roll_number: e.roll_number,
          });
          promotedCount++;
        }
      } else {
        // Final class: Mark student as ALUMNI
        await this.supabase.from('students').update({ status: 'ALUMNI' }).eq('id', e.student_id);
        graduatedCount++;
      }
    }

    return {
      success: true,
      promoted_count: promotedCount,
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
          .select('*, class:classes(name), section:sections(name), academic_year:academic_years(name)')
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
          date_of_birth: st.date_of_birth,
          status: 'ALUMNI',
          last_class_name: lastEnrollment?.class?.name || 'Class 12',
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

    const admissionNumber = (body.admissionNumber || `ADM-${Date.now().toString().slice(-4)}`).trim();
    const firstName = (body.firstName || '').trim();
    const lastName = (body.lastName || '').trim();

    const { data: student, error: sErr } = await this.supabase
      .from('students')
      .insert({
        school_id: schoolId,
        admission_number: admissionNumber,
        first_name: firstName,
        last_name: lastName || null,
        gender: body.gender || 'OTHER',
        date_of_birth: body.dateOfBirth || null,
        emergency_contact_name: body.emergencyContactName || null,
        emergency_contact_phone: body.emergencyContactPhone || null,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (sErr) throw sErr;

    // Determine target session
    let academicYearId = body.academicYearId;
    if (!academicYearId) {
      const { data: currYear } = await this.supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', schoolId)
        .eq('is_current', true)
        .maybeSingle();
      academicYearId = currYear?.id;
    }

    // Determine target class & section
    if (body.sectionId) {
      let classId = body.classId;
      if (!classId) {
        const { data: sec } = await this.supabase
          .from('sections')
          .select('id, class_id')
          .eq('id', body.sectionId)
          .single();
        classId = sec?.class_id;
      }

      await this.supabase.from('student_enrollments').insert({
        student_id: student.id,
        section_id: body.sectionId,
        class_id: classId,
        academic_year_id: academicYearId,
        roll_number: body.rollNumber ? String(body.rollNumber) : '1',
        status: 'ACTIVE',
      });
    }

    return {
      success: true,
      ...student,
      fullName: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
    };
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

  private async getSubscriptionDetails(targetSchoolId?: string): Promise<any> {
    const schoolId = targetSchoolId || this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    // 1. Try RPC get_school_subscription_details
    try {
      const { data, error } = await this.supabase.rpc('get_school_subscription_details', {
        p_school_id: schoolId,
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
      const [subRes, walletRes, studentCountRes, txnsRes] = await Promise.all([
        this.supabase.from('school_subscriptions').select('*').eq('school_id', schoolId).maybeSingle(),
        this.supabase.from('school_wallets').select('*').eq('school_id', schoolId).maybeSingle(),
        this.supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'ACTIVE'),
        this.supabase.from('wallet_transactions').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(25),
      ]);

      if (subRes?.data) subData = subRes.data;
      if (walletRes?.data) walletData = walletRes.data;
      if (studentCountRes?.count !== undefined && studentCountRes.count !== null) activeStudents = studentCountRes.count;
      if (txnsRes?.data && Array.isArray(txnsRes.data)) txnsList = txnsRes.data;
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
    if (isNaN(amount) || amount <= 0) throw new Error('Top up amount must be greater than zero');

    // 1. Try RPC top_up_school_wallet
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

    // 2. Direct Fallback with Local Cache Support
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
    const refId = `TOP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const txnRecord = {
      id: `txn-${Date.now()}`,
      school_id: schoolId,
      amount: amount,
      transaction_type: 'CREDIT',
      category: 'TOP_UP',
      balance_after: newBalance,
      reference_id: refId,
      description: body.notes || 'School Administrator Top-Up',
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
      console.warn('Supabase direct DB update failed for top-up, cached locally', dbErr);
    }

    return {
      success: true,
      reference_id: refId,
      amount,
      old_balance: oldBalance,
      new_balance: newBalance,
    };
  }

  private async calculateMonthlySubscription(targetSchoolId?: string): Promise<any> {
    const schoolId = targetSchoolId || this.getSchoolId();
    if (!schoolId) throw new Error('School context missing');

    // 1. Try RPC
    try {
      const { data, error } = await this.supabase.rpc('calculate_monthly_subscription', {
        p_school_id: schoolId,
      });
      if (!error && data) return data;
    } catch (e) {
      console.warn('RPC calculate_monthly_subscription error, falling back', e);
    }

    // 2. Fallback Calculation
    let rate = 20.00;
    const localSubs = this.getLocalSubscriptions();
    if (localSubs[schoolId]?.per_student_fee) {
      rate = Number(localSubs[schoolId].per_student_fee) || 20.00;
    }

    try {
      const { data: sub } = await this.supabase
        .from('school_subscriptions')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();

      if (sub?.per_student_fee) {
        rate = Number(sub.per_student_fee);
      }
    } catch {}

    let students: any[] = [];
    try {
      const { data } = await this.supabase
        .from('students')
        .select('*, student_enrollments(*, class:classes(name), section:sections(name))')
        .eq('school_id', schoolId)
        .eq('status', 'ACTIVE');
      if (data) students = data;
    } catch {}

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalCalculatedFee = 0;
    const breakdown = (students || []).map((st: any) => {
      const enDate = new Date(st.created_at || now);
      const enEnrollment = st.student_enrollments?.[0];
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
        admission_number: st.admission_number,
        student_name: `${st.first_name || ''} ${st.last_name || ''}`.trim(),
        enrollment_date: st.created_at?.split('T')[0],
        status: st.status,
        class_name: enEnrollment?.class?.name || 'Class',
        section_name: enEnrollment?.section?.name || 'A',
        student_fee: studentFee,
        billing_note: billingNote,
      };
    });

    return {
      school_id: schoolId,
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
    const rate = calc.per_student_rate;

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
      if (currWallet) oldBalance = Number(currWallet.balance) || 0;
    } catch {}

    const newBalance = oldBalance - fee; // Can be negative!
    const refId = `SUB-${new Date().toISOString().slice(0, 7).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const txnRecord = {
      id: `txn-${Date.now()}`,
      school_id: schoolId,
      amount: -fee,
      transaction_type: 'DEBIT',
      category: 'SUBSCRIPTION_FEE',
      balance_after: newBalance,
      reference_id: refId,
      description: `SaaS Subscription for ${calc.cycle_month} (${studentCount} Students @ ₹${rate}/mo)`,
      student_count: studentCount,
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
      console.warn('Supabase direct DB update failed for billing, cached locally', dbErr);
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
      if (!error && data) return data;
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
          notes: reason,
        });
      } catch (adjErr) {
        console.warn('Wallet adjustment error, recorded locally', adjErr);
      }
    }

    return {
      success: true,
      school_id: schoolId,
      new_rate: rate,
    };
  }
}
