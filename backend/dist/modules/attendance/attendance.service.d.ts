import { PrismaService } from '../../prisma/prisma.service';
import { BulkMarkAttendanceDto } from './dto/mark-attendance.dto';
export declare class AttendanceService {
    private prisma;
    constructor(prisma: PrismaService);
    bulkMarkAttendance(schoolId: string, userId: string, dto: BulkMarkAttendanceDto): Promise<{
        message: string;
        markedCount: number;
        date: string;
        sectionId: string;
    }>;
    getSectionAttendance(schoolId: string, sectionId: string, dateStr: string): Promise<{
        sectionId: string;
        date: string;
        summary: {
            totalStudents: number;
            presentCount: number;
            absentCount: number;
            lateCount: number;
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
        }[];
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
    getMyChildrenAttendance(schoolId: string, parentUserId: string, targetStudentId?: string): Promise<{
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
}
