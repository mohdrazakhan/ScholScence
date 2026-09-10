import { PrismaService } from '../../prisma/prisma.service';
export declare class SchoolsService {
    private prisma;
    constructor(prisma: PrismaService);
    getCurrentSchool(schoolId: string): Promise<{
        academic_years: {
            name: string;
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            start_date: Date;
            end_date: Date;
            is_current: boolean;
        }[];
        branches: {
            name: string;
            id: string;
            email: string | null;
            phone: string | null;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
            code: string;
            address_line1: string | null;
            address_line2: string | null;
            city: string | null;
            state: string | null;
            country: string | null;
            postal_code: string | null;
        }[];
    } & {
        name: string;
        id: string;
        email: string | null;
        phone: string | null;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        code: string;
        address_line1: string | null;
        address_line2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postal_code: string | null;
    }>;
    getAcademicYears(schoolId: string): Promise<{
        name: string;
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        start_date: Date;
        end_date: Date;
        is_current: boolean;
    }[]>;
    getPublicSchools(): Promise<{
        name: string;
        id: string;
        email: string;
        phone: string;
        code: string;
        address_line1: string;
        city: string;
        state: string;
    }[]>;
    getBranches(schoolId: string): Promise<{
        name: string;
        id: string;
        email: string | null;
        phone: string | null;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
        code: string;
        address_line1: string | null;
        address_line2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postal_code: string | null;
    }[]>;
}
