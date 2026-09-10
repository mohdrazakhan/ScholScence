import { PrismaService } from '../../prisma/prisma.service';
export interface CreateNoticeDto {
    title: string;
    content: string;
    targetAudience?: string;
    expiresAt?: string;
}
export interface CreateEventDto {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    isHoliday?: boolean;
    targetAudience?: string;
}
export declare class CommunicationService {
    private prisma;
    constructor(prisma: PrismaService);
    getNotices(schoolId: string, role?: string): Promise<({
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
    })[]>;
    createNotice(schoolId: string, userId: string, dto: CreateNoticeDto): Promise<{
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
    }>;
    getEvents(schoolId: string): Promise<({
        creator: {
            first_name: string;
            last_name: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        description: string | null;
        title: string;
        school_id: string;
        academic_year_id: string;
        start_time: Date;
        end_time: Date;
        target_audience: string;
        location: string | null;
        is_holiday: boolean;
        created_by: string;
    })[]>;
    createEvent(schoolId: string, userId: string, dto: CreateEventDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        description: string | null;
        title: string;
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
