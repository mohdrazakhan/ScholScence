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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const schools_service_1 = require("./schools.service");
const schools_dto_1 = require("./dto/schools.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const auth_metadata_decorator_1 = require("../../common/decorators/auth-metadata.decorator");
let SchoolsController = class SchoolsController {
    constructor(schoolsService) {
        this.schoolsService = schoolsService;
    }
    getPublicSchools() {
        return this.schoolsService.getPublicSchools();
    }
    getCurrentSchool(schoolId) {
        return this.schoolsService.getCurrentSchool(schoolId);
    }
    getAcademicYears(schoolId) {
        return this.schoolsService.getAcademicYears(schoolId);
    }
    getBranches(schoolId) {
        return this.schoolsService.getBranches(schoolId);
    }
    getAllSchools(user) {
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
            throw new common_1.ForbiddenException('Only Company Developers / Super Admins can view the full school network.');
        }
        return this.schoolsService.getAllSchoolsWithStats();
    }
    onboardSchool(user, dto) {
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
            throw new common_1.ForbiddenException('Only Company Developers / Super Admins can onboard new schools.');
        }
        return this.schoolsService.onboardSchool(dto);
    }
    updateSchoolStatus(user, schoolId, dto) {
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
            throw new common_1.ForbiddenException('Only Company Developers / Super Admins can alter school activation status.');
        }
        return this.schoolsService.updateSchoolStatus(schoolId, dto.status);
    }
    updateSchoolServices(user, schoolId, dto) {
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
            throw new common_1.ForbiddenException('Only Company Developers / Super Admins can configure service restrictions.');
        }
        return this.schoolsService.updateSchoolServices(schoolId, dto.disabledServices || []);
    }
};
exports.SchoolsController = SchoolsController;
__decorate([
    (0, auth_metadata_decorator_1.Public)(),
    (0, common_1.Get)('public'),
    (0, swagger_1.ApiOperation)({ summary: 'List all active schools for public directory and login portal', description: 'Returns public school names, codes, affiliations, and logos without authentication.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Public school directory retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "getPublicSchools", null);
__decorate([
    (0, common_1.Get)('current'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current tenant school profile and configurations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tenant school profile returned' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "getCurrentSchool", null);
__decorate([
    (0, common_1.Get)('academic-years'),
    (0, swagger_1.ApiOperation)({ summary: 'List academic years for current school' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Academic years list returned' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "getAcademicYears", null);
__decorate([
    (0, common_1.Get)('branches'),
    (0, swagger_1.ApiOperation)({ summary: 'List campuses/branches for current school' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'School branch locations returned' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "getBranches", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, swagger_1.ApiOperation)({ summary: 'List all schools in network with live statistics (Super Admin only)', description: 'Returns all schools, active student/class/staff counts, and primary school administrator profiles.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Complete school network directory retrieved' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "getAllSchools", null);
__decorate([
    (0, common_1.Post)('onboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Onboard a new school and provision initial School Administrator (Super Admin only)', description: 'Atomic creation of School, Branch, Academic Year, School Admin user, foundational classes, and curriculum subjects.' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'School and School Administrator onboarded successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, schools_dto_1.OnboardSchoolDto]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "onboardSchool", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Deboard or reactivate an institution (Super Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'School UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'School status updated' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, schools_dto_1.UpdateSchoolStatusDto]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "updateSchoolStatus", null);
__decorate([
    (0, common_1.Patch)(':id/services'),
    (0, swagger_1.ApiOperation)({ summary: 'Manage and restrict institutional community services (Super Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'School UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service permissions updated' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, schools_dto_1.UpdateSchoolServicesDto]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "updateSchoolServices", null);
exports.SchoolsController = SchoolsController = __decorate([
    (0, swagger_1.ApiTags)('Schools'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('schools'),
    __metadata("design:paramtypes", [schools_service_1.SchoolsService])
], SchoolsController);
//# sourceMappingURL=schools.controller.js.map