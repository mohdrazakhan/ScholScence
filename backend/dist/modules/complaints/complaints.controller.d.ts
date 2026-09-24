import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, AddMessageDto, UpdateStatusDto, AssignComplaintDto } from './dto/complaints.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class ComplaintsController {
    private complaintsService;
    constructor(complaintsService: ComplaintsService);
    getComplaints(schoolId: string, user: AuthenticatedUser, scope?: string, classId?: string, sectionId?: string, status?: string, category?: string): Promise<({
        student: {
            student_enrollments: ({
                section: {
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
                };
            } & {
                id: string;
                academic_year_id: string;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                section_id: string;
                student_id: string;
                roll_number: string | null;
                enrollment_date: Date;
            })[];
        } & {
            id: string;
            school_id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            first_name: string;
            last_name: string | null;
            admission_number: string;
            middle_name: string | null;
            date_of_birth: Date | null;
            gender: string | null;
            blood_group: string | null;
            photo_url: string | null;
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
        users: {
            id: string;
            email: string;
            first_name: string;
            last_name: string;
        };
        guardian: {
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
    } & {
        id: string;
        school_id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        subject: string;
        student_id: string | null;
        ticket_number: string;
        guardian_id: string;
        category: string;
        priority: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    })[]>;
    getMyChildren(schoolId: string, user: AuthenticatedUser): Promise<any[]>;
    getFaculty(schoolId: string): Promise<any[]>;
    getComplaintById(id: string, user: AuthenticatedUser): Promise<{
        student: {
            student_enrollments: ({
                section: {
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
                };
            } & {
                id: string;
                academic_year_id: string;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                section_id: string;
                student_id: string;
                roll_number: string | null;
                enrollment_date: Date;
            })[];
        } & {
            id: string;
            school_id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            first_name: string;
            last_name: string | null;
            admission_number: string;
            middle_name: string | null;
            date_of_birth: Date | null;
            gender: string | null;
            blood_group: string | null;
            photo_url: string | null;
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
        users: {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            email: string | null;
            phone: string | null;
            password_hash: string;
            first_name: string;
            last_name: string | null;
            email_verified_at: Date | null;
            phone_verified_at: Date | null;
            last_login_at: Date | null;
        };
        guardian: {
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
    } & {
        id: string;
        school_id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        subject: string;
        student_id: string | null;
        ticket_number: string;
        guardian_id: string;
        category: string;
        priority: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
    createComplaint(schoolId: string, user: AuthenticatedUser, dto: CreateComplaintDto): Promise<{
        student: {
            student_enrollments: ({
                section: {
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
                };
            } & {
                id: string;
                academic_year_id: string;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                section_id: string;
                student_id: string;
                roll_number: string | null;
                enrollment_date: Date;
            })[];
        } & {
            id: string;
            school_id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            first_name: string;
            last_name: string | null;
            admission_number: string;
            middle_name: string | null;
            date_of_birth: Date | null;
            gender: string | null;
            blood_group: string | null;
            photo_url: string | null;
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
        users: {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            email: string | null;
            phone: string | null;
            password_hash: string;
            first_name: string;
            last_name: string | null;
            email_verified_at: Date | null;
            phone_verified_at: Date | null;
            last_login_at: Date | null;
        };
        guardian: {
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
    } & {
        id: string;
        school_id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        subject: string;
        student_id: string | null;
        ticket_number: string;
        guardian_id: string;
        category: string;
        priority: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
    addMessage(id: string, user: AuthenticatedUser, dto: AddMessageDto): Promise<{
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
    }>;
    updateStatus(id: string, dto: UpdateStatusDto): Promise<{
        student: {
            id: string;
            school_id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            first_name: string;
            last_name: string | null;
            admission_number: string;
            middle_name: string | null;
            date_of_birth: Date | null;
            gender: string | null;
            blood_group: string | null;
            photo_url: string | null;
        };
        users: {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            email: string | null;
            phone: string | null;
            password_hash: string;
            first_name: string;
            last_name: string | null;
            email_verified_at: Date | null;
            phone_verified_at: Date | null;
            last_login_at: Date | null;
        };
        guardian: {
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
    } & {
        id: string;
        school_id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        subject: string;
        student_id: string | null;
        ticket_number: string;
        guardian_id: string;
        category: string;
        priority: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
    assignComplaint(id: string, schoolId: string, user: AuthenticatedUser, dto: AssignComplaintDto): Promise<{
        student: {
            student_enrollments: ({
                section: {
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
                };
            } & {
                id: string;
                academic_year_id: string;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                section_id: string;
                student_id: string;
                roll_number: string | null;
                enrollment_date: Date;
            })[];
        } & {
            id: string;
            school_id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            first_name: string;
            last_name: string | null;
            admission_number: string;
            middle_name: string | null;
            date_of_birth: Date | null;
            gender: string | null;
            blood_group: string | null;
            photo_url: string | null;
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
        users: {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            email: string | null;
            phone: string | null;
            password_hash: string;
            first_name: string;
            last_name: string | null;
            email_verified_at: Date | null;
            phone_verified_at: Date | null;
            last_login_at: Date | null;
        };
        guardian: {
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
    } & {
        id: string;
        school_id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        subject: string;
        student_id: string | null;
        ticket_number: string;
        guardian_id: string;
        category: string;
        priority: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
}
