"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceEnabledGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const auth_metadata_decorator_1 = require("../decorators/auth-metadata.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
let ServiceEnabledGuard = class ServiceEnabledGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredService = this.reflector.getAllAndOverride(auth_metadata_decorator_1.SERVICE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredService) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        let user = request.user;
        if (!user && request.headers.authorization) {
            const authHeader = request.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7).trim();
                try {
                    const parts = token.split('.');
                    if (parts.length === 3) {
                        const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                        user = {
                            userId: decoded.sub,
                            email: decoded.email,
                            schoolId: decoded.schoolId,
                            schoolCode: decoded.schoolCode,
                            role: decoded.role,
                        };
                        request.user = user;
                    }
                }
                catch {
                }
            }
        }
        if (user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_ADMIN') {
            throw new common_1.ForbiddenException('Super Admin root login is restricted to institutional governance. To perform school operations, please log in with standard school credentials.');
        }
        const schoolId = user?.schoolId || request.headers['x-tenant-id'];
        if (!schoolId) {
            throw new common_1.ForbiddenException('Access denied: No active school context found for service verification.');
        }
        const school = await this.prisma.school.findUnique({
            where: { id: schoolId },
            select: {
                id: true,
                name: true,
                status: true,
                address_line2: true,
            },
        });
        if (!school) {
            throw new common_1.ForbiddenException('Institution not found');
        }
        if (school.status === 'SUSPENDED' || school.status === 'DEBOARDED') {
            throw new common_1.ForbiddenException(`School "${school.name}" has been ${school.status.toLowerCase()} by platform administration.`);
        }
        let disabledServices = [];
        if (school.address_line2) {
            try {
                const parsed = JSON.parse(school.address_line2);
                if (Array.isArray(parsed.disabledServices)) {
                    disabledServices = parsed.disabledServices;
                }
            }
            catch {
            }
        }
        if (disabledServices.includes(requiredService)) {
            throw new common_1.ForbiddenException(`The "${requiredService}" service has been disabled for this institution by platform governance.`);
        }
        return true;
    }
};
exports.ServiceEnabledGuard = ServiceEnabledGuard;
exports.ServiceEnabledGuard = ServiceEnabledGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], ServiceEnabledGuard);
//# sourceMappingURL=service-enabled.guard.js.map