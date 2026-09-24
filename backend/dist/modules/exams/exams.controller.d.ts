import { ExamsService } from './exams.service';
import { BulkEnterMarksDto } from './dto/enter-marks.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class ExamsController {
    private examsService;
    constructor(examsService: ExamsService);
    getExams(schoolId: string): Promise<({
        academic_year: {
            id: string;
            school_id: string;
            name: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            start_date: Date;
            end_date: Date;
            is_current: boolean;
        };
        exam_subjects: ({
            class_subject: {
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
                subject: {
                    id: string;
                    school_id: string;
                    name: string;
                    code: string;
                    display_order: number;
                    status: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    description: string | null;
                    subject_type: string;
                };
            } & {
                id: string;
                academic_year_id: string;
                class_id: string;
                display_order: number;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                subject_id: string;
                is_optional: boolean;
            };
        } & {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            class_subject_id: string;
            start_time: Date | null;
            end_time: Date | null;
            exam_id: string;
            exam_date: Date | null;
            max_marks: import("@prisma/client/runtime/library").Decimal;
            passing_marks: import("@prisma/client/runtime/library").Decimal;
        })[];
        grading_scheme: {
            id: string;
            school_id: string;
            name: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            description: string | null;
            grades_json: import("@prisma/client/runtime/library").JsonValue;
        };
    } & {
        id: string;
        school_id: string;
        academic_year_id: string;
        name: string;
        code: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        start_date: Date;
        end_date: Date;
        grading_scheme_id: string | null;
    })[]>;
    getExamSubjects(examId: string): Promise<({
        class_subject: {
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
            subject: {
                id: string;
                school_id: string;
                name: string;
                code: string;
                display_order: number;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                description: string | null;
                subject_type: string;
            };
        } & {
            id: string;
            academic_year_id: string;
            class_id: string;
            display_order: number;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            subject_id: string;
            is_optional: boolean;
        };
    } & {
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        class_subject_id: string;
        start_time: Date | null;
        end_time: Date | null;
        exam_id: string;
        exam_date: Date | null;
        max_marks: import("@prisma/client/runtime/library").Decimal;
        passing_marks: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    getExamSubjectMarks(examSubjectId: string, sectionId?: string): Promise<{
        examSubject: {
            class_subject: {
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
                subject: {
                    id: string;
                    school_id: string;
                    name: string;
                    code: string;
                    display_order: number;
                    status: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    description: string | null;
                    subject_type: string;
                };
            } & {
                id: string;
                academic_year_id: string;
                class_id: string;
                display_order: number;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                subject_id: string;
                is_optional: boolean;
            };
            exam: {
                id: string;
                school_id: string;
                academic_year_id: string;
                name: string;
                code: string;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                start_date: Date;
                end_date: Date;
                grading_scheme_id: string | null;
            };
        } & {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            class_subject_id: string;
            start_time: Date | null;
            end_time: Date | null;
            exam_id: string;
            exam_date: Date | null;
            max_marks: import("@prisma/client/runtime/library").Decimal;
            passing_marks: import("@prisma/client/runtime/library").Decimal;
        };
        students: {
            studentId: string;
            enrollmentId: string;
            rollNumber: string;
            admissionNumber: string;
            name: string;
            sectionName: string;
            sectionId: string;
            marksObtained: number;
            isAbsent: any;
            grade: any;
            remarks: any;
        }[];
    }>;
    enterMarks(schoolId: string, user: AuthenticatedUser, dto: BulkEnterMarksDto): Promise<{
        message: string;
        count: number;
        examSubjectId: string;
    }>;
    getStudentReport(studentId: string, examId?: string): Promise<{
        student: {
            id: string;
            name: string;
            admissionNumber: string;
            className: string;
            sectionName: string;
            rollNumber: string;
            academicYear: string;
        };
        summary: {
            totalSubjects: number;
            totalMaxMarks: number;
            totalMarksObtained: number;
            overallPercentage: string;
        };
        subjectResults: {
            examName: string;
            subjectName: string;
            subjectCode: string;
            maxMarks: number;
            passingMarks: number;
            marksObtained: number;
            isAbsent: boolean;
            grade: string;
            remarks: string;
        }[];
    }>;
}
