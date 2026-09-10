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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const attendance_service_1 = require("./attendance.service");
const mark_attendance_dto_1 = require("./dto/mark-attendance.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const auth_metadata_decorator_1 = require("../../common/decorators/auth-metadata.decorator");
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    bulkMark(schoolId, user, dto) {
        return this.attendanceService.bulkMarkAttendance(schoolId, user.userId, dto);
    }
    getSectionAttendance(schoolId, sectionId, date) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        return this.attendanceService.getSectionAttendance(schoolId, sectionId, targetDate);
    }
    getMyChildren(schoolId, user, studentId) {
        return this.attendanceService.getMyChildrenAttendance(schoolId, user.userId, studentId);
    }
    getStudentAttendance(studentId, month) {
        return this.attendanceService.getStudentAttendance(studentId, month);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('bulk'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk mark student attendance for a section and date', description: 'Allows teachers and administrators to submit daily or period attendance records for an entire section.' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Attendance records successfully saved and synced' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, mark_attendance_dto_1.BulkMarkAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "bulkMark", null);
__decorate([
    (0, common_1.Get)('section/:sectionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attendance register for a section on a given date' }),
    (0, swagger_1.ApiParam)({ name: 'sectionId', description: 'Section UUID' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, example: '2026-09-10', description: 'Target date (YYYY-MM-DD), defaults to today' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attendance register and student status summary returned' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('sectionId')),
    __param(2, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getSectionAttendance", null);
__decorate([
    (0, common_1.Get)('my-children'),
    (0, swagger_1.ApiOperation)({ summary: 'Get live child attendance with subject breakdown for logged-in parent', description: 'Returns dynamic child statistics, daily register logs with real teacher markings, and course-by-course attendance rates.' }),
    (0, swagger_1.ApiQuery)({ name: 'studentId', required: false, description: 'Optional child student UUID if parent has multiple children' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Parent child attendance diary and subject breakdown returned' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getMyChildren", null);
__decorate([
    (0, common_1.Get)('student/:studentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get student attendance summary and history by student ID' }),
    (0, swagger_1.ApiParam)({ name: 'studentId', description: 'Student UUID' }),
    (0, swagger_1.ApiQuery)({ name: 'month', required: false, description: 'Month in YYYY-MM format' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Student attendance logs retrieved' }),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getStudentAttendance", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, swagger_1.ApiTags)('Attendance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, auth_metadata_decorator_1.RequireService)('ATTENDANCE'),
    (0, common_1.Controller)('attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map