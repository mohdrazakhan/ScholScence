import { AcademicsService } from './academics.service';
import { CreateSubjectDto, CreateStaffDto, CreateStudentDto } from './dto/academics.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class AcademicsController {
    private academicsService;
    constructor(academicsService: AcademicsService);
    getClasses(schoolId: string): Promise<({
        sections: {
            id: string;
            school_id: string;
            academic_year_id: string;
            class_id: string;
            name: string;
            code: string;
            capacity: number | null;
            display_order: number;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            branch_id: string;
        }[];
    } & {
        id: string;
        school_id: string;
        name: string;
        code: string;
        display_order: number;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    })[]>;
    getSections(schoolId: string, classId?: string): Promise<({
        academic_year: {
            id: string;
            school_id: string;
            name: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            start_date: Date;
            end_date: Date;
            is_current: boolean;
        };
        class: {
            id: string;
            school_id: string;
            name: string;
            code: string;
            display_order: number;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
        _count: {
            student_enrollments: number;
        };
    } & {
        id: string;
        school_id: string;
        academic_year_id: string;
        class_id: string;
        name: string;
        code: string;
        capacity: number | null;
        display_order: number;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        branch_id: string;
    })[]>;
    getSubjects(schoolId: string): Promise<{
        id: string;
        school_id: string;
        name: string;
        code: string;
        display_order: number;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        description: string | null;
        subject_type: string;
    }[]>;
    createSubject(schoolId: string, dto: CreateSubjectDto): Promise<{
        id: string;
        school_id: string;
        name: string;
        code: string;
        display_order: number;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        description: string | null;
        subject_type: string;
    }>;
    deleteSubject(schoolId: string, subjectId: string): Promise<{
        id: string;
        school_id: string;
        name: string;
        code: string;
        display_order: number;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        description: string | null;
        subject_type: string;
    }>;
    getClassSubjects(classId: string): Promise<({
        class: {
            id: string;
            school_id: string;
            name: string;
            code: string;
            display_order: number;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
        subject: {
            id: string;
            school_id: string;
            name: string;
            code: string;
            display_order: number;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            description: string | null;
            subject_type: string;
        };
    } & {
        id: string;
        academic_year_id: string;
        class_id: string;
        display_order: number;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        subject_id: string;
        is_optional: boolean;
    })[]>;
    getStudentsBySection(sectionId: string): Promise<{
        enrollmentId: string;
        studentId: string;
        admissionNumber: string;
        firstName: string;
        lastName: string;
        fullName: string;
        rollNumber: string;
        gender: string;
        bloodGroup: string;
        dob: Date;
        className: string;
        sectionName: string;
        primaryContact: {
            id: string;
            school_id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            email: string | null;
            phone: string;
            first_name: string;
            last_name: string | null;
            user_id: string | null;
            occupation: string | null;
            annual_income: import("@prisma/client/runtime/library").Decimal | null;
            address: string | null;
        };
    }[]>;
    createStudent(schoolId: string, dto: CreateStudentDto): Promise<{
        studentId: string;
        admissionNumber: string;
        fullName: string;
        className: string;
        sectionName: string;
    }>;
    getStaff(schoolId: string): Promise<any[]>;
    createStaff(schoolId: string, dto: CreateStaffDto): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    }>;
    getTeacherAssignments(schoolId: string, user: AuthenticatedUser): Promise<{
        id: string;
        teacherId: string;
        teacherName: string;
        className: string;
        sectionName: string;
        sectionId: string;
        subjectName: string;
        subjectCode: string;
        academicYear: string;
    }[]>;
}
