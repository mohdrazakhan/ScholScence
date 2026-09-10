import { CommunicationService, CreateNoticeDto, CreateEventDto } from './communication.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class CommunicationController {
    private communicationService;
    constructor(communicationService: CommunicationService);
    getNotices(schoolId: string, user: AuthenticatedUser): Promise<({
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
    })[]>;
    createNotice(schoolId: string, user: AuthenticatedUser, dto: CreateNoticeDto): Promise<{
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
    }>;
    getEvents(schoolId: string): Promise<({
        creator: {
            first_name: string;
            last_name: string;
        };
    } & {
        description: string | null;
        title: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        school_id: string;
        academic_year_id: string;
        start_time: Date;
        end_time: Date;
        target_audience: string;
        location: string | null;
        is_holiday: boolean;
        created_by: string;
    })[]>;
    createEvent(schoolId: string, user: AuthenticatedUser, dto: CreateEventDto): Promise<{
        description: string | null;
        title: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        school_id: string;
        academic_year_id: string;
        start_time: Date;
        end_time: Date;
        target_audience: string;
        location: string | null;
        is_holiday: boolean;
        created_by: string;
    }>;
}
