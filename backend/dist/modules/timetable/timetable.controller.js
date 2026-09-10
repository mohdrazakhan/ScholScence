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
exports.TimetableController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const timetable_service_1 = require("./timetable.service");
const timetable_dto_1 = require("./dto/timetable.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let TimetableController = class TimetableController {
    constructor(timetableService) {
        this.timetableService = timetableService;
    }
    getSectionTimetable(schoolId, sectionId) {
        return this.timetableService.getSectionTimetable(schoolId, sectionId);
    }
    getTeacherTimetable(schoolId, user) {
        return this.timetableService.getTeacherTimetable(schoolId, user.userId);
    }
    getMyChildTimetable(schoolId, user, studentId) {
        return this.timetableService.getMyChildTimetable(schoolId, user.userId, studentId);
    }
    savePeriod(schoolId, user, dto) {
        return this.timetableService.savePeriod(schoolId, user, dto);
    }
    bulkSaveSectionTimetable(schoolId, sectionId, user, dto) {
        return this.timetableService.bulkSaveSectionTimetable(schoolId, sectionId, user, dto);
    }
    deletePeriod(schoolId, user, periodId) {
        return this.timetableService.deletePeriod(schoolId, periodId, user);
    }
};
exports.TimetableController = TimetableController;
__decorate([
    (0, common_1.Get)('section/:sectionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get complete weekly timetable for a class section', description: 'Returns all 6-day periods, start/end times, assigned subject teachers, and recess/break intervals.' }),
    (0, swagger_1.ApiParam)({ name: 'sectionId', description: 'Section UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Weekly section timetable matrix returned' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('sectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "getSectionTimetable", null);
__decorate([
    (0, common_1.Get)('teacher'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current teacher routine across all sections', description: 'Returns weekly teaching schedule with classroom locations for the authenticated teacher.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teacher teaching routine returned' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "getTeacherTimetable", null);
__decorate([
    (0, common_1.Get)('my-child'),
    (0, swagger_1.ApiOperation)({ summary: 'Get timetable for parent logged in user', description: 'Returns enrolled child weekly schedule with break intervals and child switcher support.' }),
    (0, swagger_1.ApiQuery)({ name: 'studentId', required: false, description: 'Optional Student UUID if parent has multiple children' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Child weekly schedule returned' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "getMyChildTimetable", null);
__decorate([
    (0, common_1.Post)('periods'),
    (0, swagger_1.ApiOperation)({ summary: 'Create or update a single timetable period or interval', description: 'Authorized for Principals, School Admins, and assigned Class Teachers.' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Period slot saved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden: Insufficient permissions to modify timetable' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, timetable_dto_1.CreateTimetablePeriodDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "savePeriod", null);
__decorate([
    (0, common_1.Post)('section/:sectionId/bulk'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk save or replace section weekly timetable' }),
    (0, swagger_1.ApiParam)({ name: 'sectionId', description: 'Section UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Weekly timetable replaced successfully' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('sectionId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, timetable_dto_1.BulkUpsertTimetableDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "bulkSaveSectionTimetable", null);
__decorate([
    (0, common_1.Delete)('periods/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a timetable period slot' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Timetable Period UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Period slot removed' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "deletePeriod", null);
exports.TimetableController = TimetableController = __decorate([
    (0, swagger_1.ApiTags)('Timetable'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('timetable'),
    __metadata("design:paramtypes", [timetable_service_1.TimetableService])
], TimetableController);
//# sourceMappingURL=timetable.controller.js.map