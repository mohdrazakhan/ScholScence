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
exports.ComplaintFilterDto = exports.AssignComplaintDto = exports.UpdateStatusDto = exports.AddMessageDto = exports.CreateComplaintDto = exports.ComplaintStatus = exports.ComplaintPriority = exports.ComplaintCategory = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var ComplaintCategory;
(function (ComplaintCategory) {
    ComplaintCategory["ACADEMIC"] = "ACADEMIC";
    ComplaintCategory["BEHAVIOR"] = "BEHAVIOR";
    ComplaintCategory["FACILITIES"] = "FACILITIES";
    ComplaintCategory["TRANSPORT"] = "TRANSPORT";
    ComplaintCategory["FEES"] = "FEES";
    ComplaintCategory["BULLYING"] = "BULLYING";
    ComplaintCategory["OTHER"] = "OTHER";
})(ComplaintCategory || (exports.ComplaintCategory = ComplaintCategory = {}));
var ComplaintPriority;
(function (ComplaintPriority) {
    ComplaintPriority["LOW"] = "LOW";
    ComplaintPriority["MEDIUM"] = "MEDIUM";
    ComplaintPriority["HIGH"] = "HIGH";
    ComplaintPriority["URGENT"] = "URGENT";
})(ComplaintPriority || (exports.ComplaintPriority = ComplaintPriority = {}));
var ComplaintStatus;
(function (ComplaintStatus) {
    ComplaintStatus["OPEN"] = "OPEN";
    ComplaintStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ComplaintStatus["RESOLVED"] = "RESOLVED";
    ComplaintStatus["CLOSED"] = "CLOSED";
})(ComplaintStatus || (exports.ComplaintStatus = ComplaintStatus = {}));
class CreateComplaintDto {
}
exports.CreateComplaintDto = CreateComplaintDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ComplaintCategory, description: 'Category of the grievance ticket', example: ComplaintCategory.ACADEMIC }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateComplaintDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Subject or title of the grievance', example: 'Query regarding Mathematics chapter 4 homework evaluation' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateComplaintDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Detailed description / message content of the complaint', example: 'The homework feedback was not clear and my child needs guidance on question 3.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateComplaintDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Student ID (UUID) associated with this complaint', example: 'f07f88be-6d92-4b17-87a5-a4753498aace' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComplaintDto.prototype, "studentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ComplaintPriority, default: ComplaintPriority.MEDIUM, description: 'Priority level of the issue' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComplaintDto.prototype, "priority", void 0);
class AddMessageDto {
}
exports.AddMessageDto = AddMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message reply text', example: 'We have reviewed the query and scheduled an extra doubt session.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddMessageDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether this message is an internal staff note invisible to parents', default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AddMessageDto.prototype, "isInternalNote", void 0);
class UpdateStatusDto {
}
exports.UpdateStatusDto = UpdateStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ComplaintStatus, description: 'New ticket status', example: ComplaintStatus.IN_PROGRESS }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateStatusDto.prototype, "status", void 0);
class AssignComplaintDto {
}
exports.AssignComplaintDto = AssignComplaintDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Faculty User ID (UUID) to delegate the ticket to, or null to unassign', example: 'fda95401-c82a-4cc9-8f05-a3c3e00afc09' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignComplaintDto.prototype, "assignedTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Internal handover note for the assigned teacher', example: 'Please review mathematics syllabus progress with the parent.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignComplaintDto.prototype, "note", void 0);
class ComplaintFilterDto {
}
exports.ComplaintFilterDto = ComplaintFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Scope filter for teachers (CLASS_TEACHER, ASSIGNED, ALL)', example: 'CLASS_TEACHER' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComplaintFilterDto.prototype, "scope", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by Class ID (UUID)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComplaintFilterDto.prototype, "classId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by Section ID (UUID)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComplaintFilterDto.prototype, "sectionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ComplaintStatus, description: 'Filter by ticket status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComplaintFilterDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ComplaintCategory, description: 'Filter by category' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComplaintFilterDto.prototype, "category", void 0);
//# sourceMappingURL=complaints.dto.js.map