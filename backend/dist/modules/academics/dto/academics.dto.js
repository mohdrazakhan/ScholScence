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
exports.CreateSubjectDto = exports.SubjectTypeEnum = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var SubjectTypeEnum;
(function (SubjectTypeEnum) {
    SubjectTypeEnum["ACADEMIC"] = "ACADEMIC";
    SubjectTypeEnum["CO_CURRICULAR"] = "CO_CURRICULAR";
    SubjectTypeEnum["VOCATIONAL"] = "VOCATIONAL";
    SubjectTypeEnum["SPORTS"] = "SPORTS";
    SubjectTypeEnum["LANGUAGE"] = "LANGUAGE";
})(SubjectTypeEnum || (exports.SubjectTypeEnum = SubjectTypeEnum = {}));
class CreateSubjectDto {
}
exports.CreateSubjectDto = CreateSubjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Name of the subject', example: 'Mathematics' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique subject code within the school', example: 'MATH101' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: SubjectTypeEnum, default: SubjectTypeEnum.ACADEMIC, description: 'Classification of the subject' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SubjectTypeEnum),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "subjectType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Brief description or curriculum objectives', example: 'Core mathematics curriculum covering algebra and geometry' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "description", void 0);
//# sourceMappingURL=academics.dto.js.map