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
exports.CommunicationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CommunicationService = class CommunicationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getNotices(schoolId, role) {
        return this.prisma.notice.findMany({
            where: {
                school_id: schoolId,
                status: 'PUBLISHED',
                deleted_at: null,
            },
            include: {
                publisher: {
                    select: {
                        first_name: true,
                        last_name: true,
                    },
                },
            },
            orderBy: { published_at: 'desc' },
        });
    }
    async createNotice(schoolId, userId, dto) {
        const currentYear = await this.prisma.academicYear.findFirst({
            where: { school_id: schoolId, is_current: true, status: 'ACTIVE', deleted_at: null },
        });
        if (!currentYear) {
            throw new common_1.NotFoundException('Active academic year not found');
        }
        return this.prisma.notice.create({
            data: {
                school_id: schoolId,
                academic_year_id: currentYear.id,
                title: dto.title,
                content: dto.content,
                target_audience: dto.targetAudience || 'ALL',
                published_by: userId,
                status: 'PUBLISHED',
                expires_at: dto.expiresAt ? new Date(dto.expiresAt) : null,
            },
            include: {
                publisher: {
                    select: {
                        first_name: true,
                        last_name: true,
                    },
                },
            },
        });
    }
    async getEvents(schoolId) {
        return this.prisma.schoolEvent.findMany({
            where: {
                school_id: schoolId,
            },
            include: {
                creator: {
                    select: {
                        first_name: true,
                        last_name: true,
                    },
                },
            },
            orderBy: { start_time: 'asc' },
        });
    }
    async createEvent(schoolId, userId, dto) {
        const currentYear = await this.prisma.academicYear.findFirst({
            where: { school_id: schoolId, is_current: true, status: 'ACTIVE', deleted_at: null },
        });
        if (!currentYear) {
            throw new common_1.NotFoundException('Active academic year not found');
        }
        return this.prisma.schoolEvent.create({
            data: {
                school_id: schoolId,
                academic_year_id: currentYear.id,
                title: dto.title,
                description: dto.description || null,
                start_time: new Date(dto.startTime),
                end_time: new Date(dto.endTime),
                location: dto.location || null,
                is_holiday: dto.isHoliday || false,
                target_audience: dto.targetAudience || 'ALL',
                created_by: userId,
            },
        });
    }
};
exports.CommunicationService = CommunicationService;
exports.CommunicationService = CommunicationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommunicationService);
//# sourceMappingURL=communication.service.js.map