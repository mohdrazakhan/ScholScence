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
exports.CreateHomeworkDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateHomeworkDto {
}
exports.CreateHomeworkDto = CreateHomeworkDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Section UUID' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateHomeworkDto.prototype, "sectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Class Subject UUID' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateHomeworkDto.prototype, "classSubjectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Chapter 4: Linear Equations Homework' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHomeworkDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Complete Exercises 4.1 & 4.2 in your homework notebook.' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHomeworkDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-15', description: 'Due date in YYYY-MM-DD' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateHomeworkDto.prototype, "dueDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'https://schoolsense-files.s3.amazonaws.com/hw1.pdf' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHomeworkDto.prototype, "attachmentUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'homework_sheet.pdf' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHomeworkDto.prototype, "attachmentFileName", void 0);
//# sourceMappingURL=create-homework.dto.js.map