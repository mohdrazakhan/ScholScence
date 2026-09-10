export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName?: string;
  role: 'SCHOOL_ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'CLASS_TEACHER' | 'GUARDIAN' | 'FEE_MANAGER' | string;
  roleName: string;
  school?: {
    id: string;
    name: string;
    code: string;
  };
  permissions: string[];
  children?: {
    id: string;
    admissionNumber: string;
    name: string;
    className: string;
    sectionName: string;
    sectionId: string;
    rollNumber: number;
    relationship: string;
    isPrimaryContact: boolean;
  }[];
  teachingScope?: {
    classTeacherSections: {
      sectionId: string;
      className: string;
      sectionName: string;
      academicYear: string;
    }[];
    subjectAssignments: {
      assignmentId: string;
      sectionId: string;
      className: string;
      sectionName: string;
      subjectId: string;
      subjectName: string;
      subjectCode: string;
      classSubjectId: string;
    }[];
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface DashboardStats {
  stats: {
    totalStudents: number;
    totalClasses: number;
    totalTeachers: number;
    attendanceTodayPercentage: string;
    attendanceMarkedCount: number;
    pendingComplaints: number;
  };
  recentNotices: Notice[];
  upcomingExams: Exam[];
}

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  display_order: number;
  sections: SectionItem[];
}

export interface SectionItem {
  id: string;
  class_id: string;
  academic_year_id: string;
  name: string;
  code: string;
  capacity: number;
  display_order: number;
  class?: ClassItem;
  _count?: {
    student_enrollments: number;
  };
}

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  subject_type: string;
  display_order: number;
}

export interface StudentItem {
  enrollmentId: string;
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName?: string;
  fullName: string;
  rollNumber: number;
  gender?: string;
  bloodGroup?: string;
  dob?: string;
  className: string;
  sectionName: string;
  primaryContact?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
    name?: string;
    relationship?: string;
  };
  guardians?: {
    name: string;
    relationship?: string;
    phone?: string;
    email?: string;
  }[];
}

export interface AttendanceStudent {
  studentId: string;
  rollNumber: string | number;
  admissionNumber: string;
  name: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'EXCUSED' | 'NOT_MARKED';
  reason?: string | null;
  markedAt?: string | null;
}

export interface AttendanceRegisterResponse {
  sectionId: string;
  date: string;
  summary: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendancePercentage: string;
  };
  register: AttendanceStudent[];
}

export interface HomeworkItem {
  id: string;
  section_id: string;
  class_subject_id: string;
  teacher_id: string;
  title: string;
  description: string;
  assigned_date: string;
  due_date: string;
  status: string;
  class_subject?: {
    subject: SubjectItem;
    class?: ClassItem;
  };
  teacher?: {
    id: string;
    first_name: string;
    last_name?: string;
  };
  attachments?: {
    id: string;
    file_name: string;
    file_url: string;
  }[];
}

export interface Exam {
  id: string;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  status: string;
  grading_scheme?: {
    name: string;
    grades_json: any[];
  };
  exam_subjects?: {
    id: string;
    exam_date?: string;
    start_time?: string;
    end_time?: string;
    max_marks: number;
    passing_marks: number;
    class_subject: {
      subject: SubjectItem;
      class: ClassItem;
    };
  }[];
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  target_audience: string;
  published_at: string;
  publisher?: {
    first_name: string;
    last_name?: string;
  };
}

export interface SchoolEventItem {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_holiday: boolean;
  target_audience: string;
}

export interface ComplaintItem {
  id: string;
  ticket_number: string;
  category: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  created_at: string;
  assigned_to?: string;
  isClassTeacherTicket?: boolean;
  isAssignedToMe?: boolean;
  guardian?: {
    first_name: string;
    last_name?: string;
    phone: string;
    email?: string;
  };
  student?: {
    id: string;
    first_name: string;
    last_name?: string;
    admission_number: string;
    student_enrollments?: {
      section_id: string;
      section: {
        id: string;
        name: string;
        class: {
          id: string;
          name: string;
        };
      };
    }[];
  };
  users?: {
    id: string;
    first_name: string;
    last_name?: string;
    email: string;
  };
  messages?: {
    id: string;
    message: string;
    is_internal_note: boolean;
    created_at: string;
    sender: {
      id?: string;
      first_name: string;
      last_name?: string;
    };
  }[];
}

