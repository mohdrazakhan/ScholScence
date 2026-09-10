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
exports.SchoolsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SchoolsService = class SchoolsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCurrentSchool(schoolId) {
        const school = await this.prisma.school.findUnique({
            where: { id: schoolId },
            include: {
                branches: { where: { status: 'ACTIVE', deleted_at: null } },
                academic_years: { where: { status: 'ACTIVE', deleted_at: null }, orderBy: { start_date: 'desc' } },
            },
        });
        if (!school) {
            throw new common_1.NotFoundException('School not found');
        }
        return school;
    }
    async getAcademicYears(schoolId) {
        return this.prisma.academicYear.findMany({
            where: { school_id: schoolId, status: 'ACTIVE', deleted_at: null },
            orderBy: { start_date: 'desc' },
        });
    }
    async getPublicSchools() {
        return this.prisma.school.findMany({
            where: { status: 'ACTIVE', deleted_at: null },
            select: {
                id: true,
                name: true,
                code: true,
                city: true,
                state: true,
                address_line1: true,
                phone: true,
                email: true,
            },
            orderBy: { name: 'asc' },
        });
    }
    async getBranches(schoolId) {
        return this.prisma.schoolBranch.findMany({
            where: { school_id: schoolId, status: 'ACTIVE', deleted_at: null },
            orderBy: { name: 'asc' },
        });
    }
};
exports.SchoolsService = SchoolsService;
exports.SchoolsService = SchoolsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SchoolsService);
//# sourceMappingURL=schools.service.js.map