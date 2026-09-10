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
exports.HomeworkController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const homework_service_1 = require("./homework.service");
const create_homework_dto_1 = require("./dto/create-homework.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const auth_metadata_decorator_1 = require("../../common/decorators/auth-metadata.decorator");
let HomeworkController = class HomeworkController {
    constructor(homeworkService) {
        this.homeworkService = homeworkService;
    }
    create(schoolId, user, dto) {
        return this.homeworkService.createHomework(schoolId, user.userId, dto);
    }
    getSectionHomework(sectionId) {
        return this.homeworkService.getSectionHomework(sectionId);
    }
    getStudentHomework(studentId) {
        return this.homeworkService.getStudentHomework(studentId);
    }
    getHomeworkById(id) {
        return this.homeworkService.getHomeworkById(id);
    }
};
exports.HomeworkController = HomeworkController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create and assign homework for a section & subject' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Homework published to section diary' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_homework_dto_1.CreateHomeworkDto]),
    __metadata("design:returntype", void 0)
], HomeworkController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('section/:sectionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all homework assignments for a section' }),
    (0, swagger_1.ApiParam)({ name: 'sectionId', description: 'Section UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Section homework feed retrieved' }),
    __param(0, (0, common_1.Param)('sectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HomeworkController.prototype, "getSectionHomework", null);
__decorate([
    (0, common_1.Get)('student/:studentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get homework feed for a student (Parent/Student view)' }),
    (0, swagger_1.ApiParam)({ name: 'studentId', description: 'Student UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Student homework list retrieved' }),
    __param(0, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HomeworkController.prototype, "getStudentHomework", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get homework details by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Homework UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Homework assignment details returned' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HomeworkController.prototype, "getHomeworkById", null);
exports.HomeworkController = HomeworkController = __decorate([
    (0, swagger_1.ApiTags)('Homework'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, auth_metadata_decorator_1.RequireService)('HOMEWORK'),
    (0, common_1.Controller)('homework'),
    __metadata("design:paramtypes", [homework_service_1.HomeworkService])
], HomeworkController);
//# sourceMappingURL=homework.controller.js.map