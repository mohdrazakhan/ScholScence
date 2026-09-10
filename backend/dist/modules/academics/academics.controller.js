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
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
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
    getTeacherAssignments(schoolId, user) {
        const userId = user.role === 'TEACHER' ? user.userId : undefined;
        return this.academicsService.getTeacherAssignments(schoolId, userId);
    }
};
exports.AcademicsController = AcademicsController;
__decorate([
    (0, common_1.Get)('classes'),
    (0, swagger_1.ApiOperation)({ summary: 'List classes and their active sections' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "getClasses", null);
__decorate([
    (0, common_1.Get)('sections'),
    (0, swagger_1.ApiOperation)({ summary: 'List sections with optional classId filter' }),
    (0, swagger_1.ApiQuery)({ name: 'classId', required: false }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('classId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "getSections", null);
__decorate([
    (0, common_1.Get)('subjects'),
    (0, swagger_1.ApiOperation)({ summary: 'List all school subjects' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "getSubjects", null);
__decorate([
    (0, common_1.Post)('subjects'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new subject in the curriculum' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "createSubject", null);
__decorate([
    (0, common_1.Delete)('subjects/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove/archive a subject' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "deleteSubject", null);
__decorate([
    (0, common_1.Get)('classes/:classId/subjects'),
    (0, swagger_1.ApiOperation)({ summary: 'List subjects mapped to a specific class' }),
    __param(0, (0, common_1.Param)('classId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "getClassSubjects", null);
__decorate([
    (0, common_1.Get)('sections/:sectionId/students'),
    (0, swagger_1.ApiOperation)({ summary: 'List enrolled students in a specific section' }),
    __param(0, (0, common_1.Param)('sectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AcademicsController.prototype, "getStudentsBySection", null);
__decorate([
    (0, common_1.Get)('teacher-assignments'),
    (0, swagger_1.ApiOperation)({ summary: 'List subject teacher assignments' }),
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
    (0, common_1.Controller)('academics'),
    __metadata("design:paramtypes", [academics_service_1.AcademicsService])
], AcademicsController);
//# sourceMappingURL=academics.controller.js.map