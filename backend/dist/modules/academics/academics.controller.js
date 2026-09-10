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
exports.AcademicsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const academics_service_1 = require("./academics.service");
const academics_dto_1 = require("./dto/academics.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const auth_metadata_decorator_1 = require("../../common/decorators/auth-metadata.decorator");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let AcademicsController = class AcademicsController {
    constructor(academicsService) {
        this.academicsService = academicsService;
    }
    getClasses(schoolId) {
        return this.academicsService.getClasses(schoolId);
    }
    getSections(schoolId, classId) {
        return this.academicsService.getSections(schoolId, classId);
    }
    getSubjects(schoolId) {
        return this.academicsService.getSubjects(schoolId);
    }
    createSubject(schoolId, dto) {
        return this.academicsService.createSubject(schoolId, dto);
    }
    deleteSubject(schoolId, subjectId) {
        return this.academicsService.deleteSubject(schoolId, subjectId);
    }
    getClassSubjects(classId) {
        return this.academicsService.getClassSubjects(classId);
    }
    getStudentsBySection(sectionId) {
        return this.academicsService.getStudentsBySection(sectionId);
    }
    createStudent(schoolId, dto) {
        return this.academicsService.createStudent(schoolId, dto);
    }
    getStaff(schoolId) {
        return this.academicsService.getStaff(schoolId);
    }
    createStaff(schoolId, dto) {
        return this.academicsService.createStaff(schoolId, dto);
    }
    getTeacherAssignments(schoolId, user) {
        const userId = user.role === 'TEACHER' ? user.userId : undefined;
        return this.academicsService.getTeacherAssignments(schoolId, userId);
    }
};
exports.AcademicsController = AcademicsController;
__decorate([
    (0, common_1.Get)('classes'),
    (0, swagger_1.ApiOperation)({ summary: 'List all classes and their active sections', description: 'Returns academic classes with nested sections for the current school.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Classes and sections retrieved successfully' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "getClasses", null);
__decorate([
    (0, common_1.Get)('sections'),
    (0, swagger_1.ApiOperation)({ summary: 'List sections with optional classId filter' }),
    (0, swagger_1.ApiQuery)({ name: 'classId', required: false, description: 'Optional UUID of the class to filter sections' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sections retrieved successfully' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('classId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "getSections", null);
__decorate([
    (0, common_1.Get)('subjects'),
    (0, swagger_1.ApiOperation)({ summary: 'List all subjects in school curriculum' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subjects retrieved successfully' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "getSubjects", null);
__decorate([
    (0, common_1.Post)('subjects'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, auth_metadata_decorator_1.Roles)('SCHOOL_ADMIN', 'PRINCIPAL'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new subject in the curriculum' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Subject created successfully' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, academics_dto_1.CreateSubjectDto]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "createSubject", null);
__decorate([
    (0, common_1.Delete)('subjects/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, auth_metadata_decorator_1.Roles)('SCHOOL_ADMIN', 'PRINCIPAL'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove or archive a subject from curriculum' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Subject UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subject removed successfully' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "deleteSubject", null);
__decorate([
    (0, common_1.Get)('classes/:classId/subjects'),
    (0, swagger_1.ApiOperation)({ summary: 'List subjects mapped to a specific class' }),
    (0, swagger_1.ApiParam)({ name: 'classId', description: 'Class UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mapped class subjects retrieved' }),
    __param(0, (0, common_1.Param)('classId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "getClassSubjects", null);
__decorate([
    (0, common_1.Get)('sections/:sectionId/students'),
    (0, swagger_1.ApiOperation)({ summary: 'List enrolled students roster in a specific section' }),
    (0, swagger_1.ApiParam)({ name: 'sectionId', description: 'Section UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Student roster retrieved successfully' }),
    __param(0, (0, common_1.Param)('sectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "getStudentsBySection", null);
__decorate([
    (0, common_1.Post)('students'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, auth_metadata_decorator_1.Roles)('SCHOOL_ADMIN', 'PRINCIPAL'),
    (0, swagger_1.ApiOperation)({ summary: 'Enroll a new child / student and link parents', description: 'Creates a student profile, enrolls in section, and links guardian contact.' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Student enrolled successfully' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, academics_dto_1.CreateStudentDto]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "createStudent", null);
__decorate([
    (0, common_1.Get)('staff'),
    (0, swagger_1.ApiOperation)({ summary: 'List all staff members (Principals, Teachers, Admins)', description: 'Returns institutional faculty directory with teaching & class assignments.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Staff directory retrieved' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "getStaff", null);
__decorate([
    (0, common_1.Post)('staff'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, auth_metadata_decorator_1.Roles)('SCHOOL_ADMIN', 'PRINCIPAL'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new Principal, Teacher, or Staff member', description: 'Creates user account with role, password, and optional class teacher / subject assignment.' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Staff registered successfully' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, academics_dto_1.CreateStaffDto]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "createStaff", null);
__decorate([
    (0, common_1.Get)('teacher-assignments'),
    (0, swagger_1.ApiOperation)({ summary: 'List subject and class teacher allocations across sections' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teaching allocations retrieved' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "getTeacherAssignments", null);
exports.AcademicsController = AcademicsController = __decorate([
    (0, swagger_1.ApiTags)('Academics'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, auth_metadata_decorator_1.RequireService)('ACADEMICS'),
    (0, common_1.Controller)('academics'),
    __metadata("design:paramtypes", [academics_service_1.AcademicsService])
], AcademicsController);
//# sourceMappingURL=academics.controller.js.map