import { HomeworkService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class HomeworkController {
    private homeworkService;
    constructor(homeworkService: HomeworkService);
    create(schoolId: string, user: AuthenticatedUser, dto: CreateHomeworkDto): Promise<{
        class_subject: {
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
        id: string;
        school_id: string;
        academic_year_id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        description: string;
        section_id: string;
        class_subject_id: string;
        teacher_id: string;
        title: string;
        assigned_date: Date;
        due_date: Date;
    }>;
    getSectionHomework(sectionId: string): Promise<({
        class_subject: {
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
        id: string;
        school_id: string;
        academic_year_id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        description: string;
        section_id: string;
        class_subject_id: string;
        teacher_id: string;
        title: string;
        assigned_date: Date;
        due_date: Date;
    })[]>;
    getStudentHomework(studentId: string): Promise<({
        class_subject: {
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
        id: string;
        school_id: string;
        academic_year_id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        description: string;
        section_id: string;
        class_subject_id: string;
        teacher_id: string;
        title: string;
        assigned_date: Date;
        due_date: Date;
    })[]>;
    getHomeworkById(id: string): Promise<{
        section: {
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
        };
        class_subject: {
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
        id: string;
        school_id: string;
        academic_year_id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        description: string;
        section_id: string;
        class_subject_id: string;
        teacher_id: string;
        title: string;
        assigned_date: Date;
        due_date: Date;
    }>;
}
