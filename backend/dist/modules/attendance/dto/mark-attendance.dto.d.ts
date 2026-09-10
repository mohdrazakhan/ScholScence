export declare enum AttendanceStatus {
    PRESENT = "PRESENT",
    ABSENT = "ABSENT",
    LATE = "LATE",
    HALF_DAY = "HALF_DAY",
    EXCUSED = "EXCUSED"
}
export declare class StudentAttendanceItemDto {
    studentId: string;
    status: AttendanceStatus;
    reason?: string;
}
export declare class BulkMarkAttendanceDto {
    sectionId: string;
    date: string;
    classSubjectId?: string;
    periodNumber?: number;
    records: StudentAttendanceItemDto[];
}
