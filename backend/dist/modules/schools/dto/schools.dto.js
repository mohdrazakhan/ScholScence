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
exports.UpdateSchoolServicesDto = exports.UpdateSchoolStatusDto = exports.SwitchSchoolDto = exports.OnboardSchoolDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class OnboardSchoolDto {
}
exports.OnboardSchoolDto = OnboardSchoolDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Institutional School Name', example: 'Delhi Public World School' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardSchoolDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique School Code / Subdomain Identifier', example: 'DPWS01' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardSchoolDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Affiliation / Board (CBSE, ICSE, IB, State Board)', example: 'CBSE' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardSchoolDto.prototype, "affiliation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'School Official Email', example: 'contact@dpws.edu.in' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], OnboardSchoolDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'School Contact Phone Number', example: '+91 11 28765432' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardSchoolDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Campus Street Address', example: 'Sector 18, Expressway Campus' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardSchoolDto.prototype, "addressLine1", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'City', example: 'Noida' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardSchoolDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'State', example: 'Uttar Pradesh' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardSchoolDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Postal PIN Code', example: '201301' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardSchoolDto.prototype, "postalCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'School Admin First Name', example: 'Ramesh' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardSchoolDto.prototype, "adminFirstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'School Admin Last Name', example: 'Gupta' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardSchoolDto.prototype, "adminLastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'School Admin Official Login Email', example: 'admin@dpws.edu.in' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], OnboardSchoolDto.prototype, "adminEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'School Admin Mobile Phone', example: '+91 98765 43210' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardSchoolDto.prototype, "adminPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Initial Login Password (defaults to password123)', example: 'password123' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardSchoolDto.prototype, "adminPassword", void 0);
class SwitchSchoolDto {
}
exports.SwitchSchoolDto = SwitchSchoolDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target School UUID to switch active session to' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SwitchSchoolDto.prototype, "schoolId", void 0);
class UpdateSchoolStatusDto {
}
exports.UpdateSchoolStatusDto = UpdateSchoolStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'New school status: ACTIVE or SUSPENDED', example: 'SUSPENDED' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSchoolStatusDto.prototype, "status", void 0);
class UpdateSchoolServicesDto {
}
exports.UpdateSchoolServicesDto = UpdateSchoolServicesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of disabled service codes for this school',
        example: ['TIMETABLE', 'COMPLAINTS'],
    }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], UpdateSchoolServicesDto.prototype, "disabledServices", void 0);
//# sourceMappingURL=schools.dto.js.map