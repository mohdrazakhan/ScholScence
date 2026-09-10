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
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        description: string;
        title: string;
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
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        description: string;
        title: string;
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
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        description: string;
        title: string;
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
        };
        class_subject: {
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
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        description: string;
        title: string;
        school_id: string;
        academic_year_id: string;
        section_id: string;
        class_subject_id: string;
        assigned_date: Date;
        due_date: Date;
        teacher_id: string;
    }>;
}
