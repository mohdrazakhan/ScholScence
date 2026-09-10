import { AcademicsService } from './academics.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class AcademicsController {
    private academicsService;
    constructor(academicsService: AcademicsService);
    getClasses(schoolId: string): Promise<({
        sections: {
            name: string;
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            code: string;
            academic_year_id: string;
            class_id: string;
            capacity: number | null;
            display_order: number;
            branch_id: string;
        }[];
    } & {
        name: string;
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        code: string;
        display_order: number;
    })[]>;
    getSections(schoolId: string, classId?: string): Promise<({
        class: {
            name: string;
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            code: string;
            display_order: number;
        };
        _count: {
            student_enrollments: number;
        };
        academic_year: {
            name: string;
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            start_date: Date;
            end_date: Date;
            is_current: boolean;
        };
    } & {
        name: string;
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        code: string;
        academic_year_id: string;
        class_id: string;
        capacity: number | null;
        display_order: number;
        branch_id: string;
    })[]>;
    getSubjects(schoolId: string): Promise<{
        name: string;
        description: string | null;
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        code: string;
        display_order: number;
        subject_type: string;
    }[]>;
    createSubject(schoolId: string, dto: {
        name: string;
        code: string;
        subjectType?: string;
        description?: string;
    }): Promise<{
        name: string;
        description: string | null;
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        code: string;
        display_order: number;
        subject_type: string;
    }>;
    deleteSubject(schoolId: string, subjectId: string): Promise<{
        name: string;
        description: string | null;
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        code: string;
        display_order: number;
        subject_type: string;
    }>;
    getClassSubjects(classId: string): Promise<({
        class: {
            name: string;
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            code: string;
            display_order: number;
        };
        subject: {
            name: string;
            description: string | null;
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            code: string;
            display_order: number;
            subject_type: string;
        };
    } & {
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        academic_year_id: string;
        class_id: string;
        display_order: number;
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
            email: string | null;
            phone: string;
            first_name: string;
            last_name: string | null;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            user_id: string | null;
            school_id: string;
            occupation: string | null;
            annual_income: import("@prisma/client/runtime/library").Decimal | null;
            address: string | null;
        };
    }[]>;
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
