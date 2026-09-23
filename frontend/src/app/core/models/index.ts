export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName?: string;
  role: 'SCHOOL_ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'CLASS_TEACHER' | 'GUARDIAN' | 'FEE_MANAGER' | string;
  roleName: string;
  avatarUrl?: string;
  photoUrl?: string;
  school?: {
    id: string;
    name: string;
    code: string;
    status?: string;
    logoUrl?: string;
    logo_url?: string;
    disabledServices?: string[];
  };
  isSupportSession?: boolean;
  permissions: string[];
  children?: {
    id: string;
    studentId?: string;
    admissionNumber: string;
    name: string;
    className: string;
    sectionName: string;
    sectionId?: string;
    rollNumber?: number | string;
    relationship?: string;
    isPrimaryContact?: boolean;
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
    activeStudents?: number;
    inactiveStudents?: number;
    totalClasses: number;
    totalTeachers: number;
    attendanceTodayPercentage: string;
    attendanceMarkedCount: number;
    pendingComplaints: number;
  };
  recentNotices: Notice[];
  upcomingExams: Exam[];
}

export interface AcademicSession {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: string;
  student_count?: number;
  section_count?: number;
  created_at?: string;
}

export interface AlumniStudent {
  student_id: string;
  admission_number: string;
  alumni_number?: string;
  first_name: string;
  last_name?: string;
  full_name: string;
  photoUrl?: string;
  photo_url?: string;
  gender?: string;
  date_of_birth?: string;
  dateOfBirth?: string;
  blood_group?: string;
  status: string;
  last_class_name?: string;
  last_section_name?: string;
  graduation_session?: string;
  last_roll_number?: string | number;
  admission_date?: string;
  admission_class_name?: string;
  leaving_date?: string;
  leaving_reason?: string;
  tc_number?: string;
  tc_issue_date?: string;
  character_cert_number?: string;
  alumni_cert_number?: string;
  conduct?: string;
  remarks?: string;
  primary_contact?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
    relationship?: string;
  };
}

export interface StudentLifecycleLog {
  id: string;
  student_id: string;
  event_type: 'ADMISSION' | 'PROMOTION' | 'SECTION_CHANGE' | 'DEMOTION' | 'STATUS_CHANGE' | 'ALUMNI_GRADUATION' | 'TC_ISSUED' | 'CERTIFICATE_GENERATED';
  title: string;
  description: string;
  academic_session?: string;
  class_name?: string;
  section_name?: string;
  roll_number?: string | number;
  status?: string;
  tc_number?: string;
  alumni_number?: string;
  performed_by_name?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  display_order: number;
  sections: SectionItem[];
  subjects?: SubjectItem[];
}

export interface SectionItem {
  id: string;
  class_id: string;
  academic_year_id: string;
  name: string;
  code: string;
  capacity: number;
  enrolled_count?: number;
  display_order: number;
  class_teacher_id?: string | null;
  class?: ClassItem;
  subjects?: SubjectItem[];
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
  description?: string;
  class_id?: string;
  class_name?: string;
  section_ids?: string[];
  section_names?: string[];
  is_all_sections?: boolean;
}

export interface StudentItem {
  id?: string;
  enrollmentId: string;
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName?: string;
  fullName: string;
  photoUrl?: string;
  photo_url?: string;
  guardianPhotoUrl?: string;
  rollNumber?: number | string;
  gender?: string;
  bloodGroup?: string;
  dob?: string;
  dateOfBirth?: string;
  className: string;
  sectionName: string;
  classId?: string;
  sectionId?: string;
  primaryContact?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
    name?: string;
    relationship?: string;
    photoUrl?: string;
  };
  status?: string;
  activeHours?: number;
  activeDays?: number;
  activeTimeFormatted?: string;
  isBillable?: boolean;
  guardians?: {
    name: string;
    relationship?: string;
    phone?: string;
    email?: string;
    photoUrl?: string;
  }[];
}

export interface StudentDeactivationRequest {
  id: string;
  school_id: string;
  request_type?: 'PROMOTION' | 'DEMOTION' | 'SECTION_CHANGE' | 'ALUMNI' | 'INACTIVE' | 'SUSPENDED' | 'LEFTOUT' | string;
  student_id: string;
  student_name: string;
  admission_number: string;
  class_id?: string;
  class_name: string;
  section_id?: string;
  section_name: string;
  target_class_id?: string;
  target_class_name?: string;
  target_section_id?: string;
  target_section_name?: string;
  target_roll_number?: string;
  target_status?: string;
  passing_session?: string;
  leaving_certificate_number?: string;
  requested_by_user_id: string;
  requested_by_name: string;
  requested_by_role?: string;
  reason: string;
  comments?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by_user_id?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

export interface AttendanceConfig {
  frequency: 'ONCE_DAILY' | 'TWICE_DAILY';
  isConfigured: boolean;
  updatedAt?: string;
}

export interface AttendanceStudent {
  studentId: string;
  rollNumber: string | number;
  admissionNumber: string;
  name: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'EXCUSED' | 'NOT_MARKED';
  session?: 'MORNING' | 'AFTERNOON';
  reason?: string | null;
  markedAt?: string | null;
  markedByName?: string | null;
  markedByRole?: string | null;
}

export interface AttendanceRegisterResponse {
  sectionId: string;
  date: string;
  session?: 'MORNING' | 'AFTERNOON' | 'FULL_DAY';
  frequency?: 'ONCE_DAILY' | 'TWICE_DAILY';
  classTeacherName?: string;
  isMarked?: boolean;
  lastMarkedAt?: string | null;
  lastMarkedByName?: string | null;
  lastMarkedByRole?: string | null;
  summary: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    halfDayCount?: number;
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
    id?: string;
    user_id?: string;
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

export interface SchoolSubscription {
  id: string;
  per_student_fee: number;
  billing_cycle: string;
  currency: string;
  status: string;
  next_billing_date: string;
  last_billed_date?: string;
  created_at: string;
}

export interface SchoolWallet {
  id: string;
  balance: number;
  credit_limit: number;
  currency: string;
  status: string;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  transaction_type: 'CREDIT' | 'DEBIT';
  category: 'TOP_UP' | 'SUBSCRIPTION_FEE' | 'ADJUSTMENT' | 'REFUND';
  balance_after: number;
  reference_id: string;
  description?: string;
  student_count?: number;
  payment_method?: string;
  created_at: string;
}

export interface StudentBillingBreakdownItem {
  student_id: string;
  admission_number: string;
  student_name: string;
  enrollment_date: string;
  status: string;
  active_hours?: number;
  active_time_formatted?: string;
  is_billable?: boolean;
  class_name?: string;
  section_name?: string;
  student_fee: number;
  billing_note: string;
}

export interface SubscriptionDetailsResponse {
  school_id: string;
  academic_year_id?: string;
  current_session_name?: string;
  active_students: number;
  estimated_monthly_fee: number;
  subscription: SchoolSubscription;
  wallet: SchoolWallet;
  stats: {
    active_students: number;
    estimated_monthly_fee: number;
  };
  transactions: WalletTransaction[];
}

export interface MonthlyCalculationResponse {
  school_id: string;
  academic_year_id?: string;
  current_session_name?: string;
  all_students_count?: number;
  per_student_rate: number;
  total_students: number;
  total_calculated_fee: number;
  billing_cycle: string;
  cycle_month: string;
  students_breakdown: StudentBillingBreakdownItem[];
}

export interface VisualEmailTemplateConfig {
  subject: string;
  headerTitle: string;
  headerSubtitle: string;
  greeting: string;
  openingMessage: string;
  showDetailsCard: boolean;
  detailsCardTitle: string;
  showCredentialsBox: boolean;
  credentialsBoxTitle: string;
  credentialsNote: string;
  buttonText: string;
  showKeyFeatures: boolean;
  keyFeaturesTitle: string;
  keyFeaturesList: string[];
  closingMessage: string;
  footerNote: string;
}

export interface OnboardingEmailTemplateItem {
  subject: string;
  bodyHtml: string;
  visualConfig?: VisualEmailTemplateConfig;
  config?: VisualEmailTemplateConfig;
}

export interface OnboardingEmailTemplates {
  parentWelcome: OnboardingEmailTemplateItem;
  teacherWelcome: OnboardingEmailTemplateItem;
  updatedAt?: string;
}

