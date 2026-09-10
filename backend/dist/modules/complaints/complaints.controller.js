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
exports.ComplaintsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const complaints_service_1 = require("./complaints.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let ComplaintsController = class ComplaintsController {
    constructor(complaintsService) {
        this.complaintsService = complaintsService;
    }
    getComplaints(schoolId, user, scope, classId, sectionId, status, category) {
        return this.complaintsService.getComplaints(schoolId, user, {
            scope,
            classId,
            sectionId,
            status,
            category,
        });
    }
    getMyChildren(schoolId, user) {
        return this.complaintsService.getMyChildren(schoolId, user.userId);
    }
    getFaculty(schoolId) {
        return this.complaintsService.getFaculty(schoolId);
    }
    getComplaintById(id) {
        return this.complaintsService.getComplaintById(id);
    }
    createComplaint(schoolId, user, dto) {
        return this.complaintsService.createComplaint(schoolId, user.userId, dto);
    }
    addMessage(id, user, dto) {
        return this.complaintsService.addMessage(id, user.userId, dto);
    }
    updateStatus(id, status) {
        return this.complaintsService.updateStatus(id, status);
    }
    assignComplaint(id, schoolId, user, dto) {
        return this.complaintsService.assignComplaint(id, schoolId, user, dto.assignedTo, dto.note);
    }
};
exports.ComplaintsController = ComplaintsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List complaint tickets based on user role and filters' }),
    (0, swagger_1.ApiQuery)({ name: 'scope', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'classId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sectionId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('scope')),
    __param(3, (0, common_1.Query)('classId')),
    __param(4, (0, common_1.Query)('sectionId')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "getComplaints", null);
__decorate([
    (0, common_1.Get)('my-children'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of enrolled children for the logged-in parent' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "getMyChildren", null);
__decorate([
    (0, common_1.Get)('faculty'),
    (0, swagger_1.ApiOperation)({ summary: 'List teachers and faculty for ticket delegation' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "getFaculty", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get complaint ticket details and message thread' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "getComplaintById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a new complaint ticket' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "createComplaint", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a message or reply to a complaint thread' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "addMessage", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    (0, swagger_1.ApiOperation)({ summary: 'Delegate or assign complaint ticket to a faculty member' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "assignComplaint", null);
exports.ComplaintsController = ComplaintsController = __decorate([
    (0, swagger_1.ApiTags)('Complaints / Grievances'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('complaints'),
    __metadata("design:paramtypes", [complaints_service_1.ComplaintsService])
], ComplaintsController);
//# sourceMappingURL=complaints.controller.js.map