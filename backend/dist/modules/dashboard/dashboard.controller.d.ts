import { DashboardService } from './dashboard.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class DashboardController {
    private dashboardService;
    constructor(dashboardService: DashboardService);
    getOverview(schoolId: string, user: AuthenticatedUser): Promise<{
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
            title: string;
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            academic_year_id: string;
            content: string;
            published_by: string;
            target_audience: string;
            published_at: Date;
            expires_at: Date | null;
        })[];
        upcomingExams: {
            name: string;
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            code: string;
            academic_year_id: string;
            start_date: Date;
            end_date: Date;
            grading_scheme_id: string | null;
        }[];
    } | {
        parentData: {
            children: any[];
            primaryChild: any;
            childStats: {
                attendancePercentage: string;
                totalDays: number;
                presentDays: number;
                pendingHomeworkCount: number;
                latestGrade: string;
            };
            recentNotices: {
                title: string;
                id: string;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
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
            title: string;
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            academic_year_id: string;
            content: string;
            published_by: string;
            target_audience: string;
            published_at: Date;
            expires_at: Date | null;
        })[];
        upcomingExams: {
            name: string;
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            code: string;
            academic_year_id: string;
            start_date: Date;
            end_date: Date;
            grading_scheme_id: string | null;
        }[];
    }>;
}
