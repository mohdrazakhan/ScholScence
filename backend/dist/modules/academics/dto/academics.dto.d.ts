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
