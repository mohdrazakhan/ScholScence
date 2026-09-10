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
exports.BulkEnterMarksDto = exports.StudentMarkItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class StudentMarkItemDto {
}
exports.StudentMarkItemDto = StudentMarkItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Student UUID' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], StudentMarkItemDto.prototype, "studentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 88.5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], StudentMarkItemDto.prototype, "marksObtained", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], StudentMarkItemDto.prototype, "isAbsent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'A2' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StudentMarkItemDto.prototype, "grade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'Excellent conceptual understanding' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StudentMarkItemDto.prototype, "remarks", void 0);
class BulkEnterMarksDto {
}
exports.BulkEnterMarksDto = BulkEnterMarksDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Exam Subject UUID' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BulkEnterMarksDto.prototype, "examSubjectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [StudentMarkItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StudentMarkItemDto),
    __metadata("design:type", Array)
], BulkEnterMarksDto.prototype, "marks", void 0);
//# sourceMappingURL=enter-marks.dto.js.map