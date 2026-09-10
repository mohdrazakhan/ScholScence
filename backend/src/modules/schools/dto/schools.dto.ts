import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsOptional, Matches } from 'class-validator';

export class OnboardSchoolDto {
  @ApiProperty({ description: 'Institutional School Name', example: 'Delhi Public World School' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Unique School Code / Subdomain Identifier', example: 'DPWS01' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Affiliation / Board (CBSE, ICSE, IB, State Board)', example: 'CBSE' })
  @IsOptional()
  @IsString()
  affiliation?: string;

  @ApiPropertyOptional({ description: 'School Official Email', example: 'contact@dpws.edu.in' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'School Contact Phone Number', example: '+91 11 28765432' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Campus Street Address', example: 'Sector 18, Expressway Campus' })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Noida' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State', example: 'Uttar Pradesh' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Postal PIN Code', example: '201301' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  // --- Initial School Administrator Details ---
  @ApiProperty({ description: 'School Admin First Name', example: 'Ramesh' })
  @IsNotEmpty()
  @IsString()
  adminFirstName: string;

  @ApiPropertyOptional({ description: 'School Admin Last Name', example: 'Gupta' })
  @IsOptional()
  @IsString()
  adminLastName?: string;

  @ApiProperty({ description: 'School Admin Official Login Email', example: 'admin@dpws.edu.in' })
  @IsNotEmpty()
  @IsEmail()
  adminEmail: string;

  @ApiPropertyOptional({ description: 'School Admin Mobile Phone', example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  adminPhone?: string;

  @ApiPropertyOptional({ description: 'Initial Login Password (defaults to password123)', example: 'password123' })
  @IsOptional()
  @IsString()
  adminPassword?: string;
}

export class SwitchSchoolDto {
  @ApiProperty({ description: 'Target School UUID to switch active session to' })
  @IsNotEmpty()
  @IsString()
  schoolId: string;
}

export class UpdateSchoolStatusDto {
  @ApiProperty({ description: 'New school status: ACTIVE or SUSPENDED', example: 'SUSPENDED' })
  @IsNotEmpty()
  @IsString()
  status: 'ACTIVE' | 'SUSPENDED';
}

export class UpdateSchoolServicesDto {
  @ApiProperty({
    description: 'Array of disabled service codes for this school',
    example: ['TIMETABLE', 'COMPLAINTS'],
  })
  @IsNotEmpty()
  disabledServices: string[];
}
