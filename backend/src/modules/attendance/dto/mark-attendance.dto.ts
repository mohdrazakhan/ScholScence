import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  EXCUSED = 'EXCUSED',
}

export class StudentAttendanceItemDto {
  @ApiProperty({ description: 'Student UUID' })
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({ required: false, description: 'Reason for absence or note' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false, description: 'Individual record ISO timestamp', example: '2026-09-23T11:53:20.000Z' })
  @IsOptional()
  @IsDateString()
  markedAt?: string;

  @ApiProperty({ required: false, description: 'Name of the user who marked this record', example: 'Rajesh Gupta' })
  @IsOptional()
  @IsString()
  markedByName?: string;

  @ApiProperty({ required: false, description: 'Role of the user who marked this record', example: 'School Admin' })
  @IsOptional()
  @IsString()
  markedByRole?: string;
}

export class BulkMarkAttendanceDto {
  @ApiProperty({ description: 'Section UUID' })
  @IsNotEmpty()
  @IsUUID()
  sectionId: string;

  @ApiProperty({ example: '2026-09-10', description: 'Date in YYYY-MM-DD' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ required: false, description: 'Class Subject ID if marking subject-specific period attendance' })
  @IsOptional()
  @IsUUID()
  classSubjectId?: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  periodNumber?: number;

  @ApiProperty({ type: [StudentAttendanceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceItemDto)
  records: StudentAttendanceItemDto[];
}
