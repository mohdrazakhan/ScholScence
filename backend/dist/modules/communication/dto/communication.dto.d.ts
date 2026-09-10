export declare enum TargetAudienceEnum {
    ALL = "ALL",
    TEACHERS = "TEACHERS",
    PARENTS = "PARENTS",
    STUDENTS = "STUDENTS"
}
export declare class CreateNoticeDto {
    title: string;
    content: string;
    targetAudience?: string;
    expiresAt?: string;
}
export declare class CreateEventDto {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    isHoliday?: boolean;
    targetAudience?: string;
}
