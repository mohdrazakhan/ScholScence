import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export interface CreateComplaintDto {
    category: string;
    subject: string;
    message: string;
    studentId?: string;
    priority?: string;
}
export interface AddMessageDto {
    message: string;
    isInternalNote?: boolean;
}
export interface ComplaintFilterDto {
    scope?: string;
    classId?: string;
    sectionId?: string;
    status?: string;
    category?: string;
}
export declare class ComplaintsService {
    private prisma;
    constructor(prisma: PrismaService);
    getComplaints(schoolId: string, user: AuthenticatedUser, filters?: ComplaintFilterDto): Promise<({
        student: {
            student_enrollments: ({
                section: {
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
        ticket_number: string;
        category: string;
        priority: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    })[]>;
    getMyChildren(schoolId: string, userId: string): Promise<{
        studentId: string;
        admissionNumber: string;
        firstName: string;
        lastName: string;
        fullName: string;
        className: string;
        sectionName: string;
        sectionId: string;
        relationship: string;
    }[]>;
    getFaculty(schoolId: string): Promise<any[]>;
    getComplaintById(id: string): Promise<{
        student: {
            student_enrollments: ({
                section: {
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
        users: {
            id: string;
            email: string | null;
            phone: string | null;
            password_hash: string;
            first_name: string;
            last_name: string | null;
            status: string;
            email_verified_at: Date | null;
            phone_verified_at: Date | null;
            last_login_at: Date | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
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
        ticket_number: string;
        category: string;
        priority: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
    createComplaint(schoolId: string, userId: string, dto: CreateComplaintDto): Promise<{
        student: {
            student_enrollments: ({
                section: {
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
        users: {
            id: string;
            email: string | null;
            phone: string | null;
            password_hash: string;
            first_name: string;
            last_name: string | null;
            status: string;
            email_verified_at: Date | null;
            phone_verified_at: Date | null;
            last_login_at: Date | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
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
        ticket_number: string;
        category: string;
        priority: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
    assignComplaint(complaintId: string, schoolId: string, user: AuthenticatedUser, assignedToUserId: string | null, note?: string): Promise<{
        student: {
            student_enrollments: ({
                section: {
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
        users: {
            id: string;
            email: string | null;
            phone: string | null;
            password_hash: string;
            first_name: string;
            last_name: string | null;
            status: string;
            email_verified_at: Date | null;
            phone_verified_at: Date | null;
            last_login_at: Date | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
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
        ticket_number: string;
        category: string;
        priority: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
    addMessage(complaintId: string, userId: string, dto: AddMessageDto): Promise<{
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
    updateStatus(complaintId: string, status: string): Promise<{
        student: {
            student_enrollments: ({
                section: {
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
        users: {
            id: string;
            email: string | null;
            phone: string | null;
            password_hash: string;
            first_name: string;
            last_name: string | null;
            status: string;
            email_verified_at: Date | null;
            phone_verified_at: Date | null;
            last_login_at: Date | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
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
        ticket_number: string;
        category: string;
        priority: string;
        assigned_to: string | null;
        resolved_at: Date | null;
    }>;
}
