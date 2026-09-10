import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ComplaintCategory {
  ACADEMIC = 'ACADEMIC',
  BEHAVIOR = 'BEHAVIOR',
  FACILITIES = 'FACILITIES',
  TRANSPORT = 'TRANSPORT',
  FEES = 'FEES',
  BULLYING = 'BULLYING',
  OTHER = 'OTHER',
}

export enum ComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ComplaintStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export class CreateComplaintDto {
  @ApiProperty({ enum: ComplaintCategory, description: 'Category of the grievance ticket', example: ComplaintCategory.ACADEMIC })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: 'Subject or title of the grievance', example: 'Query regarding Mathematics chapter 4 homework evaluation' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'Detailed description / message content of the complaint', example: 'The homework feedback was not clear and my child needs guidance on question 3.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Student ID (UUID) associated with this complaint', example: 'f07f88be-6d92-4b17-87a5-a4753498aace' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ enum: ComplaintPriority, default: ComplaintPriority.MEDIUM, description: 'Priority level of the issue' })
  @IsOptional()
  @IsString()
  priority?: string;
}

export class AddMessageDto {
  @ApiProperty({ description: 'Message reply text', example: 'We have reviewed the query and scheduled an extra doubt session.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Whether this message is an internal staff note invisible to parents', default: false })
  @IsOptional()
  @IsBoolean()
  isInternalNote?: boolean;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: ComplaintStatus, description: 'New ticket status', example: ComplaintStatus.IN_PROGRESS })
  @IsString()
  @IsNotEmpty()
  status: string;
}

export class AssignComplaintDto {
  @ApiPropertyOptional({ description: 'Faculty User ID (UUID) to delegate the ticket to, or null to unassign', example: 'fda95401-c82a-4cc9-8f05-a3c3e00afc09' })
  @IsOptional()
  @IsString()
  assignedTo: string | null;

  @ApiPropertyOptional({ description: 'Internal handover note for the assigned teacher', example: 'Please review mathematics syllabus progress with the parent.' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ComplaintFilterDto {
  @ApiPropertyOptional({ description: 'Scope filter for teachers (CLASS_TEACHER, ASSIGNED, ALL)', example: 'CLASS_TEACHER' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: 'Filter by Class ID (UUID)' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ description: 'Filter by Section ID (UUID)' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ enum: ComplaintStatus, description: 'Filter by ticket status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ComplaintCategory, description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;
}
