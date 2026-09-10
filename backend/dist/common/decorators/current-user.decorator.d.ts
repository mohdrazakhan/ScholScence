export interface AuthenticatedUser {
    userId: string;
    email: string;
    firstName: string;
    lastName?: string;
    schoolId: string;
    schoolCode: string;
    role: string;
    permissions: string[];
}
export declare const CurrentUser: (...dataOrPipes: (keyof AuthenticatedUser | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>>)[]) => ParameterDecorator;
