import { ComplaintsService, CreateComplaintDto, AddMessageDto } from './complaints.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class ComplaintsController {
    private complaintsService;
    constructor(complaintsService: ComplaintsService);
    getComplaints(schoolId: string, user: AuthenticatedUser): Promise<({
        student: {
            id: string;
            first_name: string;
            last_name: string | null;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            admission_number: string;
            middle_name: string | null;
            date_of_birth: Date | null;
            gender: string | null;
            blood_group: string | null;
            photo_url: string | null;
        };
        guardian: {
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
        messages: ({
            sender: {
                first_name: string;
                last_name: string;
            };
        } & {
            id: string;
            created_at: Date;
            complaint_id: string;
            sender_user_id: string;
            message: string;
            is_internal_note: boolean;
        })[];
    } & {
        subject: string;
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        student_id: string | null;
        guardian_id: string;
        ticket_number: string;
        category: string;
        priority: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    })[]>;
    getComplaintById(id: string): Promise<{
        student: {
            id: string;
            first_name: string;
            last_name: string | null;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            admission_number: string;
            middle_name: string | null;
            date_of_birth: Date | null;
            gender: string | null;
            blood_group: string | null;
            photo_url: string | null;
        };
        guardian: {
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
        messages: ({
            sender: {
                id: string;
                first_name: string;
                last_name: string;
            };
        } & {
            id: string;
            created_at: Date;
            complaint_id: string;
            sender_user_id: string;
            message: string;
            is_internal_note: boolean;
        })[];
    } & {
        subject: string;
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        student_id: string | null;
        guardian_id: string;
        ticket_number: string;
        category: string;
        priority: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
    createComplaint(schoolId: string, user: AuthenticatedUser, dto: CreateComplaintDto): Promise<{
        guardian: {
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
        messages: {
            id: string;
            created_at: Date;
            complaint_id: string;
            sender_user_id: string;
            message: string;
            is_internal_note: boolean;
        }[];
    } & {
        subject: string;
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        student_id: string | null;
        guardian_id: string;
        ticket_number: string;
        category: string;
        priority: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
    addMessage(id: string, user: AuthenticatedUser, dto: AddMessageDto): Promise<{
        sender: {
            first_name: string;
            last_name: string;
        };
    } & {
        id: string;
        created_at: Date;
        complaint_id: string;
        sender_user_id: string;
        message: string;
        is_internal_note: boolean;
    }>;
    updateStatus(id: string, status: string): Promise<{
        subject: string;
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        student_id: string | null;
        guardian_id: string;
        ticket_number: string;
        category: string;
        priority: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
}
