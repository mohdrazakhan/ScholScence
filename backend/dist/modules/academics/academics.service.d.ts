import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubjectDto, CreateStaffDto, CreateStudentDto } from './dto/academics.dto';
export declare class AcademicsService {
    private prisma;
    constructor(prisma: PrismaService);
    getClasses(schoolId: string): Promise<({
        sections: {
            id: string;
            code: string;
            name: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            academic_year_id: string;
            class_id: string;
            capacity: number | null;
            display_order: number;
            branch_id: string;
        }[];
    } & {
        id: string;
        code: string;
        name: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        display_order: number;
    })[]>;
    getSections(schoolId: string, classId?: string): Promise<({
        class: {
            id: string;
            code: string;
            name: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            display_order: number;
        };
        _count: {
            student_enrollments: number;
        };
        academic_year: {
            id: string;
            name: string;
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
        id: string;
        code: string;
        name: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        academic_year_id: string;
        class_id: string;
        capacity: number | null;
        display_order: number;
        branch_id: string;
    })[]>;
    getSubjects(schoolId: string): Promise<{
        id: string;
        code: string;
        name: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        description: string | null;
        school_id: string;
        display_order: number;
        subject_type: string;
    }[]>;
    getClassSubjects(classId: string, academicYearId?: string): Promise<({
        class: {
            id: string;
            code: string;
            name: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            display_order: number;
        };
        subject: {
            id: string;
            code: string;
            name: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            description: string | null;
            school_id: string;
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
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            first_name: string;
            last_name: string | null;
            user_id: string | null;
            school_id: string;
            occupation: string | null;
            annual_income: import("@prisma/client/runtime/library").Decimal | null;
            address: string | null;
        };
    }[]>;
    getTeacherAssignments(schoolId: string, userId?: string): Promise<{
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
    getStaff(schoolId: string): Promise<any[]>;
    createStaff(schoolId: string, dto: CreateStaffDto): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    }>;
    createStudent(schoolId: string, dto: CreateStudentDto): Promise<{
        studentId: string;
        admissionNumber: string;
        fullName: string;
        className: string;
        sectionName: string;
    }>;
    createSubject(schoolId: string, dto: CreateSubjectDto): Promise<{
        id: string;
        code: string;
        name: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        description: string | null;
        school_id: string;
        display_order: number;
        subject_type: string;
    }>;
    deleteSubject(schoolId: string, subjectId: string): Promise<{
        id: string;
        code: string;
        name: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        description: string | null;
        school_id: string;
        display_order: number;
        subject_type: string;
    }>;
}
