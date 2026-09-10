export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const PERMISSIONS_KEY = "permissions";
export declare const RequirePermissions: (...permissions: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const IS_PUBLIC_KEY = "isPublic";
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
export declare const SERVICE_KEY = "required_service";
export declare const RequireService: (service: string) => import("@nestjs/common").CustomDecorator<string>;
