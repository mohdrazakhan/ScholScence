import { SchoolsService } from './schools.service';
import { OnboardSchoolDto, UpdateSchoolStatusDto, UpdateSchoolServicesDto } from './dto/schools.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class SchoolsController {
    private schoolsService;
    constructor(schoolsService: SchoolsService);
    getPublicSchools(): Promise<{
        id: string;
        name: string;
        code: string;
        email: string;
        phone: string;
        address_line1: string;
        city: string;
        state: string;
    }[]>;
    getCurrentSchool(schoolId: string): Promise<{
        disabledServices: string[];
        academic_years: {
            id: string;
            school_id: string;
            name: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            start_date: Date;
            end_date: Date;
            is_current: boolean;
        }[];
        branches: {
            id: string;
            school_id: string;
            name: string;
            code: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            email: string | null;
            phone: string | null;
            address_line1: string | null;
            address_line2: string | null;
            city: string | null;
            state: string | null;
            country: string | null;
            postal_code: string | null;
        }[];
        id: string;
        name: string;
        code: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        email: string | null;
        phone: string | null;
        address_line1: string | null;
        address_line2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postal_code: string | null;
    }>;
    getAcademicYears(schoolId: string): Promise<{
        id: string;
        school_id: string;
        name: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        start_date: Date;
        end_date: Date;
        is_current: boolean;
    }[]>;
    getBranches(schoolId: string): Promise<{
        id: string;
        school_id: string;
        name: string;
        code: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        email: string | null;
        phone: string | null;
        address_line1: string | null;
        address_line2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postal_code: string | null;
    }[]>;
    getAllSchools(user: AuthenticatedUser): Promise<{
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
    onboardSchool(user: AuthenticatedUser, dto: OnboardSchoolDto): Promise<{
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
    updateSchoolStatus(user: AuthenticatedUser, schoolId: string, dto: UpdateSchoolStatusDto): Promise<{
        id: string;
        name: string;
        status: string;
        message: string;
    }>;
    updateSchoolServices(user: AuthenticatedUser, schoolId: string, dto: UpdateSchoolServicesDto): Promise<{
        id: string;
        name: string;
        disabledServices: string[];
        message: string;
    }>;
}
