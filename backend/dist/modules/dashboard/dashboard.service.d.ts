import { PrismaService } from '../../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getAdminDashboard(schoolId: string): Promise<{
        stats: {
            totalStudents: number;
            totalClasses: number;
            totalTeachers: number;
            attendanceTodayPercentage: string;
            attendanceMarkedCount: number;
            pendingComplaints: number;
        };
        recentNotices: ({
            publisher: {
                first_name: string;
                last_name: string;
            };
        } & {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            title: string;
            school_id: string;
            academic_year_id: string;
            content: string;
            published_by: string;
            target_audience: string;
            published_at: Date;
            expires_at: Date | null;
        })[];
        upcomingExams: {
            id: string;
            code: string;
            name: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            academic_year_id: string;
            start_date: Date;
            end_date: Date;
            grading_scheme_id: string | null;
        }[];
    }>;
    getParentDashboard(schoolId: string, userId: string): Promise<{
        children: any[];
        primaryChild: any;
        childStats: any;
        recentNotices: {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            title: string;
            school_id: string;
            academic_year_id: string;
            content: string;
            published_by: string;
            target_audience: string;
            published_at: Date;
            expires_at: Date | null;
        }[];
    }>;
    getOverview(schoolId: string, user: any): Promise<{
        stats: {
            totalStudents: number;
            totalClasses: number;
            totalTeachers: number;
            attendanceTodayPercentage: string;
            attendanceMarkedCount: number;
            pendingComplaints: number;
        };
        recentNotices: ({
            publisher: {
                first_name: string;
                last_name: string;
            };
        } & {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            title: string;
            school_id: string;
            academic_year_id: string;
            content: string;
            published_by: string;
            target_audience: string;
            published_at: Date;
            expires_at: Date | null;
        })[];
        upcomingExams: {
            id: string;
            code: string;
            name: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            academic_year_id: string;
            start_date: Date;
            end_date: Date;
            grading_scheme_id: string | null;
        }[];
    } | {
        parentData: {
            children: any[];
            primaryChild: any;
            childStats: any;
            recentNotices: {
                id: string;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                title: string;
                school_id: string;
                academic_year_id: string;
                content: string;
                published_by: string;
                target_audience: string;
                published_at: Date;
                expires_at: Date | null;
            }[];
        };
        stats: {
            totalStudents: number;
            totalClasses: number;
            totalTeachers: number;
            attendanceTodayPercentage: string;
            attendanceMarkedCount: number;
            pendingComplaints: number;
        };
        recentNotices: ({
            publisher: {
                first_name: string;
                last_name: string;
            };
        } & {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            title: string;
            school_id: string;
            academic_year_id: string;
            content: string;
            published_by: string;
            target_audience: string;
            published_at: Date;
            expires_at: Date | null;
        })[];
        upcomingExams: {
            id: string;
            code: string;
            name: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            academic_year_id: string;
            start_date: Date;
            end_date: Date;
            grading_scheme_id: string | null;
        }[];
    }>;
}
