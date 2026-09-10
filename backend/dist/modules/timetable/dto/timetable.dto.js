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
exports.BulkUpsertTimetableDto = exports.CreateTimetablePeriodDto = exports.SlotType = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var SlotType;
(function (SlotType) {
    SlotType["ACADEMIC"] = "ACADEMIC";
    SlotType["BREAK"] = "BREAK";
    SlotType["LUNCH"] = "LUNCH";
    SlotType["ASSEMBLY"] = "ASSEMBLY";
    SlotType["SPORTS"] = "SPORTS";
    SlotType["LIBRARY"] = "LIBRARY";
    SlotType["ACTIVITY"] = "ACTIVITY";
})(SlotType || (exports.SlotType = SlotType = {}));
class CreateTimetablePeriodDto {
}
exports.CreateTimetablePeriodDto = CreateTimetablePeriodDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Section ID (UUID)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTimetablePeriodDto.prototype, "sectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Day of week (1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday)', minimum: 1, maximum: 6 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], CreateTimetablePeriodDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Period number in sequence (1, 2, 3, etc.)', minimum: 1, maximum: 12 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], CreateTimetablePeriodDto.prototype, "periodNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Start time in HH:mm format', example: '08:30' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTimetablePeriodDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'End time in HH:mm format', example: '09:15' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTimetablePeriodDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: SlotType, default: SlotType.ACADEMIC }),
    (0, class_validator_1.IsEnum)(SlotType),
    __metadata("design:type", String)
], CreateTimetablePeriodDto.prototype, "slotType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Title for non-academic slots like Morning Assembly, Recess, Lunch Break', example: 'Recess Break' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTimetablePeriodDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Class Subject ID (UUID) for academic slots' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTimetablePeriodDto.prototype, "classSubjectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Teacher User ID (UUID)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTimetablePeriodDto.prototype, "teacherId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Classroom / Lab number', example: 'Room 204' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTimetablePeriodDto.prototype, "roomNumber", void 0);
class BulkUpsertTimetableDto {
}
exports.BulkUpsertTimetableDto = BulkUpsertTimetableDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CreateTimetablePeriodDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateTimetablePeriodDto),
    __metadata("design:type", Array)
], BulkUpsertTimetableDto.prototype, "periods", void 0);
//# sourceMappingURL=timetable.dto.js.map