export declare enum SlotType {
    ACADEMIC = "ACADEMIC",
    BREAK = "BREAK",
    LUNCH = "LUNCH",
    ASSEMBLY = "ASSEMBLY",
    SPORTS = "SPORTS",
    LIBRARY = "LIBRARY",
    ACTIVITY = "ACTIVITY"
}
export declare class CreateTimetablePeriodDto {
    sectionId: string;
    dayOfWeek: number;
    periodNumber: number;
    startTime: string;
    endTime: string;
    slotType: SlotType;
    title?: string;
    classSubjectId?: string;
    teacherId?: string;
    roomNumber?: string;
}
export declare class BulkUpsertTimetableDto {
    periods: CreateTimetablePeriodDto[];
}
