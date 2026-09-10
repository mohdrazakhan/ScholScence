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
exports.CreateStudentDto = exports.CreateStaffDto = exports.CreateSubjectDto = exports.SubjectTypeEnum = void 0;
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
class CreateStaffDto {
}
exports.CreateStaffDto = CreateStaffDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'First name of staff / faculty', example: 'Sunita' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Last name of staff', example: 'Kapoor' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Official email address used for login', example: 'principal@demo-school.com' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Contact phone number', example: '+91 98765 43210' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Staff role', example: 'PRINCIPAL', enum: ['PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'SCHOOL_ADMIN'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Initial login password (defaults to password123)', example: 'password123' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Section UUID if assigning as Class Teacher', example: 'a1b2c3d4-...' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "classTeacherSectionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Subject ID if assigning primary subject', example: 's1s2s3s4-...' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "subjectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Section ID for teaching subject assignment', example: 'e1e2e3e4-...' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "sectionId", void 0);
class CreateStudentDto {
}
exports.CreateStudentDto = CreateStudentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Student First Name', example: 'Kavya' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Student Last Name', example: 'Sharma' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique School Admission Number', example: 'DIS001-2026-101' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "admissionNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target Section UUID for enrollment', example: 'sec-uuid-...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "sectionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Class Roll Number', example: '12' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "rollNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Gender', example: 'FEMALE' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date of Birth (YYYY-MM-DD)', example: '2012-05-14' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Blood Group', example: 'O+' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "bloodGroup", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Parent / Guardian Full Name', example: 'Rajesh Sharma' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "guardianName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Parent / Guardian Email', example: 'rajesh.sharma@example.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "guardianEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Parent / Guardian Phone', example: '+91 98111 22233' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "guardianPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Parent Relationship', example: 'FATHER' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "relationship", void 0);
//# sourceMappingURL=academics.dto.js.map