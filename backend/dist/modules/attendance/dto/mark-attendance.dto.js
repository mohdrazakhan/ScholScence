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
exports.BulkMarkAttendanceDto = exports.StudentAttendanceItemDto = exports.AttendanceStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus["PRESENT"] = "PRESENT";
    AttendanceStatus["ABSENT"] = "ABSENT";
    AttendanceStatus["LATE"] = "LATE";
    AttendanceStatus["HALF_DAY"] = "HALF_DAY";
    AttendanceStatus["EXCUSED"] = "EXCUSED";
})(AttendanceStatus || (exports.AttendanceStatus = AttendanceStatus = {}));
class StudentAttendanceItemDto {
}
exports.StudentAttendanceItemDto = StudentAttendanceItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Student UUID' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], StudentAttendanceItemDto.prototype, "studentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(AttendanceStatus),
    __metadata("design:type", String)
], StudentAttendanceItemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Reason for absence or note' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StudentAttendanceItemDto.prototype, "reason", void 0);
class BulkMarkAttendanceDto {
}
exports.BulkMarkAttendanceDto = BulkMarkAttendanceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Section UUID' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BulkMarkAttendanceDto.prototype, "sectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-10', description: 'Date in YYYY-MM-DD' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], BulkMarkAttendanceDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Class Subject ID if marking subject-specific period attendance' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BulkMarkAttendanceDto.prototype, "classSubjectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 1 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], BulkMarkAttendanceDto.prototype, "periodNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [StudentAttendanceItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StudentAttendanceItemDto),
    __metadata("design:type", Array)
], BulkMarkAttendanceDto.prototype, "records", void 0);
//# sourceMappingURL=mark-attendance.dto.js.map