export declare enum ComplaintCategory {
    ACADEMIC = "ACADEMIC",
    BEHAVIOR = "BEHAVIOR",
    FACILITIES = "FACILITIES",
    TRANSPORT = "TRANSPORT",
    FEES = "FEES",
    BULLYING = "BULLYING",
    OTHER = "OTHER"
}
export declare enum ComplaintPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum ComplaintStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED"
}
export declare class CreateComplaintDto {
    category: string;
    subject: string;
    message: string;
    studentId?: string;
    priority?: string;
}
export declare class AddMessageDto {
    message: string;
    isInternalNote?: boolean;
}
export declare class UpdateStatusDto {
    status: string;
}
export declare class AssignComplaintDto {
    assignedTo: string | null;
    note?: string;
}
export declare class ComplaintFilterDto {
    scope?: string;
    classId?: string;
    sectionId?: string;
    status?: string;
    category?: string;
}
