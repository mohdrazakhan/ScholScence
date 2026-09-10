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
exports.CommunicationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const communication_service_1 = require("./communication.service");
const communication_dto_1 = require("./dto/communication.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let CommunicationController = class CommunicationController {
    constructor(communicationService) {
        this.communicationService = communicationService;
    }
    getNotices(schoolId, user) {
        return this.communicationService.getNotices(schoolId, user.role);
    }
    createNotice(schoolId, user, dto) {
        return this.communicationService.createNotice(schoolId, user.userId, dto);
    }
    getEvents(schoolId) {
        return this.communicationService.getEvents(schoolId);
    }
    createEvent(schoolId, user, dto) {
        return this.communicationService.createEvent(schoolId, user.userId, dto);
    }
};
exports.CommunicationController = CommunicationController;
__decorate([
    (0, common_1.Get)('notices'),
    (0, swagger_1.ApiOperation)({ summary: 'List notices for current school', description: 'Returns circulars filtered by the target audience and user role.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notices list retrieved successfully' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CommunicationController.prototype, "getNotices", null);
__decorate([
    (0, common_1.Post)('notices'),
    (0, swagger_1.ApiOperation)({ summary: 'Create and broadcast a new notice circular' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Notice published' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, communication_dto_1.CreateNoticeDto]),
    __metadata("design:returntype", void 0)
], CommunicationController.prototype, "createNotice", null);
__decorate([
    (0, common_1.Get)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'List calendar events and school holidays' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Academic events and holidays retrieved' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CommunicationController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Post)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new calendar event or holiday' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Event added to school calendar' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, communication_dto_1.CreateEventDto]),
    __metadata("design:returntype", void 0)
], CommunicationController.prototype, "createEvent", null);
exports.CommunicationController = CommunicationController = __decorate([
    (0, swagger_1.ApiTags)('Communication'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('communication'),
    __metadata("design:paramtypes", [communication_service_1.CommunicationService])
], CommunicationController);
//# sourceMappingURL=communication.controller.js.map