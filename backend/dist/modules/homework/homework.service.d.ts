import { PrismaService } from '../../prisma/prisma.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
export declare class HomeworkService {
    private prisma;
    constructor(prisma: PrismaService);
    createHomework(schoolId: string, teacherId: string, dto: CreateHomeworkDto): Promise<{
        class_subject: {
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
        };
        attachments: {
            id: string;
            created_at: Date;
            file_name: string;
            file_url: string;
            file_size_bytes: bigint | null;
            file_type: string | null;
            homework_id: string;
        }[];
    } & {
        description: string;
        title: string;
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        academic_year_id: string;
        section_id: string;
        class_subject_id: string;
        assigned_date: Date;
        due_date: Date;
        teacher_id: string;
    }>;
    getSectionHomework(sectionId: string): Promise<({
        class_subject: {
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
        };
        teacher: {
            id: string;
            first_name: string;
            last_name: string;
        };
        attachments: {
            id: string;
            created_at: Date;
            file_name: string;
            file_url: string;
            file_size_bytes: bigint | null;
            file_type: string | null;
            homework_id: string;
        }[];
    } & {
        description: string;
        title: string;
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        academic_year_id: string;
        section_id: string;
        class_subject_id: string;
        assigned_date: Date;
        due_date: Date;
        teacher_id: string;
    })[]>;
    getStudentHomework(studentId: string): Promise<({
        class_subject: {
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
        };
        teacher: {
            id: string;
            first_name: string;
            last_name: string;
        };
        attachments: {
            id: string;
            created_at: Date;
            file_name: string;
            file_url: string;
            file_size_bytes: bigint | null;
            file_type: string | null;
            homework_id: string;
        }[];
    } & {
        description: string;
        title: string;
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        academic_year_id: string;
        section_id: string;
        class_subject_id: string;
        assigned_date: Date;
        due_date: Date;
        teacher_id: string;
    })[]>;
    getHomeworkById(id: string): Promise<{
        section: {
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
        };
        class_subject: {
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
        };
        teacher: {
            first_name: string;
            last_name: string;
        };
        attachments: {
            id: string;
            created_at: Date;
            file_name: string;
            file_url: string;
            file_size_bytes: bigint | null;
            file_type: string | null;
            homework_id: string;
        }[];
    } & {
        description: string;
        title: string;
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        academic_year_id: string;
        section_id: string;
        class_subject_id: string;
        assigned_date: Date;
        due_date: Date;
        teacher_id: string;
    }>;
}
