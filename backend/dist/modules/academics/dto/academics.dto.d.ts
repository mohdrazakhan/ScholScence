export declare enum SubjectTypeEnum {
    ACADEMIC = "ACADEMIC",
    CO_CURRICULAR = "CO_CURRICULAR",
    VOCATIONAL = "VOCATIONAL",
    SPORTS = "SPORTS",
    LANGUAGE = "LANGUAGE"
}
export declare class CreateSubjectDto {
    name: string;
    code: string;
    subjectType?: SubjectTypeEnum;
    description?: string;
}
export declare class CreateStaffDto {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
    role: string;
    password?: string;
    classTeacherSectionId?: string;
    subjectId?: string;
    sectionId?: string;
}
export declare class CreateStudentDto {
    firstName: string;
    lastName?: string;
    admissionNumber: string;
    sectionId: string;
    rollNumber?: string;
    gender?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    guardianName?: string;
    guardianEmail?: string;
    guardianPhone?: string;
    relationship?: string;
}
