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

    // Academics: Classes
    if (cleanEndpoint === 'academics/classes') {
      return from(this.getClasses()) as unknown as Observable<T>;
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

    // Timetable
    if (cleanEndpoint === 'timetable/periods') {
      return from(this.createTimetablePeriod(body)) as unknown as Observable<T>;
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

  private async getClasses(): Promise<ClassItem[]> {
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
      sections: (c.sections || []).map((s: any) => ({
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
}
