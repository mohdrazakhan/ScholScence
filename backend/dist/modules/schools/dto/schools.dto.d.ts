export declare class OnboardSchoolDto {
    name: string;
    code: string;
    affiliation?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    adminFirstName: string;
    adminLastName?: string;
    adminEmail: string;
    adminPhone?: string;
    adminPassword?: string;
}
export declare class SwitchSchoolDto {
    schoolId: string;
}
export declare class UpdateSchoolStatusDto {
    status: 'ACTIVE' | 'SUSPENDED';
}
export declare class UpdateSchoolServicesDto {
    disabledServices: string[];
}
