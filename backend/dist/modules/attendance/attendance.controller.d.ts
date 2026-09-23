import { AttendanceService } from './attendance.service';
import { BulkMarkAttendanceDto } from './dto/mark-attendance.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class AttendanceController {
    private attendanceService;
    constructor(attendanceService: AttendanceService);
    bulkMark(schoolId: string, user: AuthenticatedUser, dto: BulkMarkAttendanceDto): Promise<{
        message: string;
        markedCount: number;
        date: string;
        sectionId: string;
    }>;
    getSectionAttendance(schoolId: string, sectionId: string, date?: string): Promise<{
        sectionId: string;
        date: string;
        isMarked: boolean;
        lastMarkedAt: Date;
        lastMarkedByName: string;
        lastMarkedByRole: string;
        summary: {
            totalStudents: number;
            presentCount: number;
            absentCount: number;
            lateCount: number;
            halfDayCount: number;
            attendancePercentage: string;
        };
        register: {
            studentId: string;
            rollNumber: string;
            admissionNumber: string;
            name: string;
            status: string;
            reason: string;
            markedAt: Date;
            markedByName: string;
            markedByRole: string;
        }[];
    }>;
    getMyChildren(schoolId: string, user: AuthenticatedUser, studentId?: string): Promise<{
        childrenList: any[];
        selectedChild: {
            studentId: any;
            admissionNumber: any;
            name: any;
            rollNumber: any;
            sectionId: any;
            sectionName: any;
            className: any;
        };
        overallSummary: {
            totalDays: number;
            presentDays: number;
            absentDays: number;
            lateDays: number;
            percentage: string;
        };
        dailyHistory: {
            id: string;
            date: Date;
            status: string;
            reason: string;
        }[];
        subjectBreakdown: any;
    }>;
    getStudentAttendance(studentId: string, month?: string): Promise<{
        studentId: string;
        studentName: string;
        totalDays: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        percentage: string;
        history: {
            id: string;
            date: Date;
            status: string;
            reason: string;
        }[];
    }>;
}
