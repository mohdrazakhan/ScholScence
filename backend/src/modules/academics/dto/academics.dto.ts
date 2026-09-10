import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SubjectTypeEnum {
  ACADEMIC = 'ACADEMIC',
  CO_CURRICULAR = 'CO_CURRICULAR',
  VOCATIONAL = 'VOCATIONAL',
  SPORTS = 'SPORTS',
  LANGUAGE = 'LANGUAGE',
}

export class CreateSubjectDto {
  @ApiProperty({ description: 'Name of the subject', example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unique subject code within the school', example: 'MATH101' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ enum: SubjectTypeEnum, default: SubjectTypeEnum.ACADEMIC, description: 'Classification of the subject' })
  @IsOptional()
  @IsEnum(SubjectTypeEnum)
  subjectType?: SubjectTypeEnum;

  @ApiPropertyOptional({ description: 'Brief description or curriculum objectives', example: 'Core mathematics curriculum covering algebra and geometry' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateStaffDto {
  @ApiProperty({ description: 'First name of staff / faculty', example: 'Sunita' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ description: 'Last name of staff', example: 'Kapoor' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'Official email address used for login', example: 'principal@demo-school.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Contact phone number', example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Staff role', example: 'PRINCIPAL', enum: ['PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'SCHOOL_ADMIN'] })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({ description: 'Initial login password (defaults to password123)', example: 'password123' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'Section UUID if assigning as Class Teacher', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsString()
  classTeacherSectionId?: string;

  @ApiPropertyOptional({ description: 'Subject ID if assigning primary subject', example: 's1s2s3s4-...' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Section ID for teaching subject assignment', example: 'e1e2e3e4-...' })
  @IsOptional()
  @IsString()
  sectionId?: string;
}

export class CreateStudentDto {
  @ApiProperty({ description: 'Student First Name', example: 'Kavya' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ description: 'Student Last Name', example: 'Sharma' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'Unique School Admission Number', example: 'DIS001-2026-101' })
  @IsString()
  @IsNotEmpty()
  admissionNumber: string;

  @ApiProperty({ description: 'Target Section UUID for enrollment', example: 'sec-uuid-...' })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiPropertyOptional({ description: 'Class Roll Number', example: '12' })
  @IsOptional()
  @IsString()
  rollNumber?: string;

  @ApiPropertyOptional({ description: 'Gender', example: 'FEMALE' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Date of Birth (YYYY-MM-DD)', example: '2012-05-14' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Blood Group', example: 'O+' })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({ description: 'Parent / Guardian Full Name', example: 'Rajesh Sharma' })
  @IsOptional()
  @IsString()
  guardianName?: string;

  @ApiPropertyOptional({ description: 'Parent / Guardian Email', example: 'rajesh.sharma@example.com' })
  @IsOptional()
  @IsString()
  guardianEmail?: string;

  @ApiPropertyOptional({ description: 'Parent / Guardian Phone', example: '+91 98111 22233' })
  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @ApiPropertyOptional({ description: 'Parent Relationship', example: 'FATHER' })
  @IsOptional()
  @IsString()
  relationship?: string;
}
