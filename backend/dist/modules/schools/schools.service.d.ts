import { PrismaService } from '../../prisma/prisma.service';
import { OnboardSchoolDto } from './dto/schools.dto';
export declare class SchoolsService {
    private prisma;
    constructor(prisma: PrismaService);
    getCurrentSchool(schoolId: string): Promise<{
        disabledServices: string[];
        academic_years: {
            id: string;
            name: string;
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
            id: string;
            code: string;
            name: string;
            email: string | null;
            phone: string | null;
            address_line1: string | null;
            address_line2: string | null;
            city: string | null;
            state: string | null;
            country: string | null;
            postal_code: string | null;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            school_id: string;
        }[];
        id: string;
        code: string;
        name: string;
        email: string | null;
        phone: string | null;
        address_line1: string | null;
        address_line2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postal_code: string | null;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
    getAcademicYears(schoolId: string): Promise<{
        id: string;
        name: string;
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
        id: string;
        code: string;
        name: string;
        email: string;
        phone: string;
        address_line1: string;
        city: string;
        state: string;
    }[]>;
    getBranches(schoolId: string): Promise<{
        id: string;
        code: string;
        name: string;
        email: string | null;
        phone: string | null;
        address_line1: string | null;
        address_line2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postal_code: string | null;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        school_id: string;
    }[]>;
    getAllSchoolsWithStats(): Promise<{
        id: string;
        name: string;
        code: string;
        email: string;
        phone: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string;
        status: string;
        disabledServices: string[];
        createdAt: Date;
        stats: {
            studentsCount: number;
            classesCount: number;
            subjectsCount: number;
            totalStaffCount: number;
        };
        admin: {
            id: string;
            firstName: string;
            lastName: string;
            fullName: string;
            email: string;
            phone: string;
            status: string;
        };
    }[]>;
    updateSchoolStatus(schoolId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<{
        id: string;
        name: string;
        status: string;
        message: string;
    }>;
    updateSchoolServices(schoolId: string, disabledServices: string[]): Promise<{
        id: string;
        name: string;
        disabledServices: string[];
        message: string;
    }>;
    onboardSchool(dto: OnboardSchoolDto): Promise<{
        school: {
            id: string;
            name: string;
            code: string;
            email: string;
            city: string;
            state: string;
        };
        admin: {
            id: string;
            fullName: string;
            email: string;
            phone: string;
            role: string;
        };
        message: string;
    }>;
}
