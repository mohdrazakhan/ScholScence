import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateComplaintDto, AddMessageDto, ComplaintFilterDto } from './dto/complaints.dto';
export declare class ComplaintsService {
    private prisma;
    constructor(prisma: PrismaService);
    getComplaints(schoolId: string, user: AuthenticatedUser, filters?: ComplaintFilterDto): Promise<({
        student: {
            student_enrollments: ({
                section: {
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
                };
            } & {
                id: string;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                academic_year_id: string;
                section_id: string;
                student_id: string;
                roll_number: string | null;
                enrollment_date: Date;
            })[];
        } & {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            first_name: string;
            last_name: string | null;
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
        messages: ({
            sender: {
                id: string;
                first_name: string;
                last_name: string;
            };
        } & {
            id: string;
            created_at: Date;
            message: string;
            complaint_id: string;
            sender_user_id: string;
            is_internal_note: boolean;
        })[];
        users: {
            id: string;
            email: string;
            first_name: string;
            last_name: string;
        };
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
        category: string;
        priority: string;
        ticket_number: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    })[]>;
    getMyChildren(schoolId: string, userId: string): Promise<any[]>;
    getFaculty(schoolId: string): Promise<any[]>;
    getComplaintById(id: string, user?: AuthenticatedUser): Promise<{
        student: {
            student_enrollments: ({
                section: {
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
                };
            } & {
                id: string;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                academic_year_id: string;
                section_id: string;
                student_id: string;
                roll_number: string | null;
                enrollment_date: Date;
            })[];
        } & {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            first_name: string;
            last_name: string | null;
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
        messages: ({
            sender: {
                id: string;
                first_name: string;
                last_name: string;
            };
        } & {
            id: string;
            created_at: Date;
            message: string;
            complaint_id: string;
            sender_user_id: string;
            is_internal_note: boolean;
        })[];
        users: {
            id: string;
            email: string | null;
            phone: string | null;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            password_hash: string;
            first_name: string;
            last_name: string | null;
            email_verified_at: Date | null;
            phone_verified_at: Date | null;
            last_login_at: Date | null;
        };
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
        category: string;
        priority: string;
        ticket_number: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
    createComplaint(schoolId: string, userId: string, dto: CreateComplaintDto): Promise<{
        student: {
            student_enrollments: ({
                section: {
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
                };
            } & {
                id: string;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                academic_year_id: string;
                section_id: string;
                student_id: string;
                roll_number: string | null;
                enrollment_date: Date;
            })[];
        } & {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            first_name: string;
            last_name: string | null;
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
        messages: ({
            sender: {
                id: string;
                first_name: string;
                last_name: string;
            };
        } & {
            id: string;
            created_at: Date;
            message: string;
            complaint_id: string;
            sender_user_id: string;
            is_internal_note: boolean;
        })[];
        users: {
            id: string;
            email: string | null;
            phone: string | null;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            password_hash: string;
            first_name: string;
            last_name: string | null;
            email_verified_at: Date | null;
            phone_verified_at: Date | null;
            last_login_at: Date | null;
        };
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
        category: string;
        priority: string;
        ticket_number: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
    assignComplaint(complaintId: string, schoolId: string, user: AuthenticatedUser, assignedToUserId: string | null, note?: string): Promise<{
        student: {
            student_enrollments: ({
                section: {
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
                };
            } & {
                id: string;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                academic_year_id: string;
                section_id: string;
                student_id: string;
                roll_number: string | null;
                enrollment_date: Date;
            })[];
        } & {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            first_name: string;
            last_name: string | null;
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
        messages: ({
            sender: {
                id: string;
                first_name: string;
                last_name: string;
            };
        } & {
            id: string;
            created_at: Date;
            message: string;
            complaint_id: string;
            sender_user_id: string;
            is_internal_note: boolean;
        })[];
        users: {
            id: string;
            email: string | null;
            phone: string | null;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            password_hash: string;
            first_name: string;
            last_name: string | null;
            email_verified_at: Date | null;
            phone_verified_at: Date | null;
            last_login_at: Date | null;
        };
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
        category: string;
        priority: string;
        ticket_number: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
    addMessage(complaintId: string, userId: string, dto: AddMessageDto): Promise<{
        sender: {
            id: string;
            first_name: string;
            last_name: string;
        };
    } & {
        id: string;
        created_at: Date;
        message: string;
        complaint_id: string;
        sender_user_id: string;
        is_internal_note: boolean;
    }>;
    updateStatus(id: string, status: string): Promise<{
        student: {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            first_name: string;
            last_name: string | null;
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
        users: {
            id: string;
            email: string | null;
            phone: string | null;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            password_hash: string;
            first_name: string;
            last_name: string | null;
            email_verified_at: Date | null;
            phone_verified_at: Date | null;
            last_login_at: Date | null;
        };
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
        category: string;
        priority: string;
        ticket_number: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
}
