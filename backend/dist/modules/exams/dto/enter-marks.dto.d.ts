export declare class StudentMarkItemDto {
    studentId: string;
    marksObtained?: number;
    isAbsent?: boolean;
    grade?: string;
    remarks?: string;
}
export declare class BulkEnterMarksDto {
    examSubjectId: string;
    marks: StudentMarkItemDto[];
}
