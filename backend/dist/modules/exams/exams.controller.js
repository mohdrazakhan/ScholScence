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
exports.ExamsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const exams_service_1 = require("./exams.service");
const enter_marks_dto_1 = require("./dto/enter-marks.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const auth_metadata_decorator_1 = require("../../common/decorators/auth-metadata.decorator");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let ExamsController = class ExamsController {
    constructor(examsService) {
        this.examsService = examsService;
    }
    getExams(schoolId) {
        return this.examsService.getExams(schoolId);
    }
    getExamSubjects(examId) {
        return this.examsService.getExamSubjects(examId);
    }
    getExamSubjectMarks(examSubjectId, sectionId) {
        return this.examsService.getExamSubjectMarks(examSubjectId, sectionId);
    }
    enterMarks(schoolId, user, dto) {
        return this.examsService.enterMarksBulk(schoolId, user.userId, dto);
    }
    getStudentReport(studentId, examId) {
        return this.examsService.getStudentReportCard(studentId, examId);
    }
};
exports.ExamsController = ExamsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all exams for the school' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "getExams", null);
__decorate([
    (0, common_1.Get)(':id/subjects'),
    (0, swagger_1.ApiOperation)({ summary: 'Get subject schedules and max marks for an exam' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "getExamSubjects", null);
__decorate([
    (0, common_1.Get)('subjects/:id/marks'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, auth_metadata_decorator_1.Roles)('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'SUPER_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get student marks list for an exam subject paper' }),
    (0, swagger_1.ApiQuery)({ name: 'sectionId', required: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('sectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "getExamSubjectMarks", null);
__decorate([
    (0, common_1.Post)('marks/bulk'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, auth_metadata_decorator_1.Roles)('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'SUPER_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk enter/update marks for students in an exam subject' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, enter_marks_dto_1.BulkEnterMarksDto]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "enterMarks", null);
__decorate([
    (0, common_1.Get)('student/:studentId/report'),
    (0, swagger_1.ApiOperation)({ summary: 'Get student academic report card' }),
    (0, swagger_1.ApiQuery)({ name: 'examId', required: false }),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Query)('examId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "getStudentReport", null);
exports.ExamsController = ExamsController = __decorate([
    (0, swagger_1.ApiTags)('Exams & Marks'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('exams'),
    __metadata("design:paramtypes", [exams_service_1.ExamsService])
], ExamsController);
//# sourceMappingURL=exams.controller.js.map