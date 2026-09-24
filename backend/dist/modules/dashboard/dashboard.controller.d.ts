import { DashboardService } from './dashboard.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class DashboardController {
    private dashboardService;
    constructor(dashboardService: DashboardService);
    getOverview(schoolId: string, user: AuthenticatedUser, academicYearId?: string): Promise<{
        stats: {
            totalStudents: number;
            activeStudents: number;
            inactiveStudents: number;
            totalClasses: number;
            totalTeachers: number;
            attendanceTodayPercentage: string;
            attendanceMarkedCount: number;
            pendingComplaints: number;
        };
        campusInfo: {
            id: string;
            name: string;
            code: string;
            email: string;
            phone: string;
            address: string;
            city: string;
            state: string;
            logoUrl: any;
            status: string;
            activeSession: string;
            activeSessionId: string;
        };
        recentNotices: ({
            publisher: {
                first_name: string;
                last_name: string;
            };
        } & {
            id: string;
            school_id: string;
            academic_year_id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            title: string;
            content: string;
            published_by: string;
            target_audience: string;
            published_at: Date;
            expires_at: Date | null;
        })[];
        upcomingExams: {
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
        }[];
    } | {
        parentData: {
            children: any[];
            primaryChild: any;
            childStats: any;
            recentNotices: {
                id: string;
                school_id: string;
                academic_year_id: string;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                title: string;
                content: string;
                published_by: string;
                target_audience: string;
                published_at: Date;
                expires_at: Date | null;
            }[];
        };
        stats: {
            totalStudents: number;
            activeStudents: number;
            inactiveStudents: number;
            totalClasses: number;
            totalTeachers: number;
            attendanceTodayPercentage: string;
            attendanceMarkedCount: number;
            pendingComplaints: number;
        };
        campusInfo: {
            id: string;
            name: string;
            code: string;
            email: string;
            phone: string;
            address: string;
            city: string;
            state: string;
            logoUrl: any;
            status: string;
            activeSession: string;
            activeSessionId: string;
        };
        recentNotices: ({
            publisher: {
                first_name: string;
                last_name: string;
            };
        } & {
            id: string;
            school_id: string;
            academic_year_id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            title: string;
            content: string;
            published_by: string;
            target_audience: string;
            published_at: Date;
            expires_at: Date | null;
        })[];
        upcomingExams: {
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
        }[];
    }>;
}
