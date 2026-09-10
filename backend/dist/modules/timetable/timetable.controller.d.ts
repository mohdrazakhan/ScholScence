import { TimetableService } from './timetable.service';
import { CreateTimetablePeriodDto, BulkUpsertTimetableDto } from './dto/timetable.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class TimetableController {
    private timetableService;
    constructor(timetableService: TimetableService);
    getSectionTimetable(schoolId: string, sectionId: string): Promise<{
        section: {
            id: string;
            name: string;
            code: string;
            classId: string;
            className: string;
            academicYearId: string;
            academicYearName: string;
        };
        availableSubjects: {
            classSubjectId: string;
            subjectId: string;
            name: string;
            code: string;
            subjectType: string;
        }[];
        periods: {
            id: string;
            dayOfWeek: number;
            dayName: string;
            periodNumber: number;
            startTime: string;
            endTime: string;
            slotType: string;
            title: string;
            subjectName: string;
            subjectCode: string;
            classSubjectId: string;
            teacherId: string;
            teacherName: string;
            roomNumber: string;
        }[];
    }>;
    getTeacherTimetable(schoolId: string, user: AuthenticatedUser, teacherId?: string): Promise<{
        teacherId: string;
        periods: {
            id: string;
            dayOfWeek: number;
            dayName: string;
            periodNumber: number;
            startTime: string;
            endTime: string;
            slotType: string;
            title: string;
            subjectName: string;
            subjectCode: string;
            className: string;
            sectionName: string;
            sectionId: string;
            roomNumber: string;
        }[];
    }>;
    getMyChildTimetable(schoolId: string, user: AuthenticatedUser, studentId?: string): Promise<{
        childrenList: any[];
        selectedChild: any;
        timetable: {
            section: {
                id: string;
                name: string;
                code: string;
                classId: string;
                className: string;
                academicYearId: string;
                academicYearName: string;
            };
            availableSubjects: {
                classSubjectId: string;
                subjectId: string;
                name: string;
                code: string;
                subjectType: string;
            }[];
            periods: {
                id: string;
                dayOfWeek: number;
                dayName: string;
                periodNumber: number;
                startTime: string;
                endTime: string;
                slotType: string;
                title: string;
                subjectName: string;
                subjectCode: string;
                classSubjectId: string;
                teacherId: string;
                teacherName: string;
                roomNumber: string;
            }[];
        };
    }>;
    savePeriod(schoolId: string, user: AuthenticatedUser, dto: CreateTimetablePeriodDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        title: string | null;
        school_id: string;
        academic_year_id: string;
        section_id: string;
        class_subject_id: string | null;
        period_number: number;
        teacher_id: string | null;
        start_time: string;
        end_time: string;
        day_of_week: string;
        slot_type: string;
        room_number: string | null;
    }>;
    bulkSaveSectionTimetable(schoolId: string, sectionId: string, user: AuthenticatedUser, dto: BulkUpsertTimetableDto): Promise<{
        section: {
            id: string;
            name: string;
            code: string;
            classId: string;
            className: string;
            academicYearId: string;
            academicYearName: string;
        };
        availableSubjects: {
            classSubjectId: string;
            subjectId: string;
            name: string;
            code: string;
            subjectType: string;
        }[];
        periods: {
            id: string;
            dayOfWeek: number;
            dayName: string;
            periodNumber: number;
            startTime: string;
            endTime: string;
            slotType: string;
            title: string;
            subjectName: string;
            subjectCode: string;
            classSubjectId: string;
            teacherId: string;
            teacherName: string;
            roomNumber: string;
        }[];
    }>;
    deletePeriod(schoolId: string, user: AuthenticatedUser, periodId: string): Promise<{
        message: string;
        id: string;
    }>;
}
