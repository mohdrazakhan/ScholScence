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
exports.CreateEventDto = exports.CreateNoticeDto = exports.TargetAudienceEnum = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var TargetAudienceEnum;
(function (TargetAudienceEnum) {
    TargetAudienceEnum["ALL"] = "ALL";
    TargetAudienceEnum["TEACHERS"] = "TEACHERS";
    TargetAudienceEnum["PARENTS"] = "PARENTS";
    TargetAudienceEnum["STUDENTS"] = "STUDENTS";
})(TargetAudienceEnum || (exports.TargetAudienceEnum = TargetAudienceEnum = {}));
class CreateNoticeDto {
}
exports.CreateNoticeDto = CreateNoticeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Title of the notice/circular', example: 'Annual Sports Meet 2026 - Schedule & Registration' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNoticeDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Full announcement body / content', example: 'The Annual Sports Meet will be held on Oct 15-16. All students are invited to register with physical education teachers.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNoticeDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: TargetAudienceEnum, default: TargetAudienceEnum.ALL, description: 'Target audience for broadcast' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNoticeDto.prototype, "targetAudience", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Expiration date timestamp', example: '2026-10-31T23:59:59Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNoticeDto.prototype, "expiresAt", void 0);
class CreateEventDto {
}
exports.CreateEventDto = CreateEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Title of the school event or holiday', example: 'Parent-Teacher Conference (PTM - Term 1)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Description / agenda of the event', example: 'Discussion of Term 1 assessment marks and progress cards.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Start date and time (ISO format)', example: '2026-09-25T09:00:00Z' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'End date and time (ISO format)', example: '2026-09-25T14:00:00Z' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Location or venue', example: 'Main Auditorium & Classrooms' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether this event is a school holiday', default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEventDto.prototype, "isHoliday", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: TargetAudienceEnum, default: TargetAudienceEnum.ALL, description: 'Target audience group' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "targetAudience", void 0);
//# sourceMappingURL=communication.dto.js.map