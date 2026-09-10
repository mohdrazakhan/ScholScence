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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(configService, prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET', 'schoolsense_jwt_super_secret_key_2026_secure'),
        });
        this.prisma = prisma;
    }
    async validate(payload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            include: {
                user_school_roles: {
                    where: { school_id: payload.schoolId, status: 'ACTIVE', deleted_at: null },
                    include: {
                        role: {
                            include: {
                                role_permissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                        school: true,
                    },
                },
            },
        });
        if (!user || user.status !== 'ACTIVE' || user.deleted_at !== null) {
            throw new common_1.UnauthorizedException('User account is invalid or deactivated');
        }
        const schoolRole = user.user_school_roles[0];
        if (!schoolRole) {
            throw new common_1.UnauthorizedException('User has no active membership in this school');
        }
        const permissions = schoolRole.role.role_permissions.map((rp) => rp.permission.code);
        return {
            userId: user.id,
            email: user.email || '',
            firstName: user.first_name,
            lastName: user.last_name || undefined,
            schoolId: schoolRole.school_id,
            schoolCode: schoolRole.school.code,
            role: schoolRole.role.code,
            permissions,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map