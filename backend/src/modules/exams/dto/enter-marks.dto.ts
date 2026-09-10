import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class StudentMarkItemDto {
  @ApiProperty({ description: 'Student UUID' })
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ required: false, example: 88.5 })
  @IsOptional()
  @IsNumber()
  marksObtained?: number;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean;

  @ApiProperty({ required: false, example: 'A2' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiProperty({ required: false, example: 'Excellent conceptual understanding' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkEnterMarksDto {
  @ApiProperty({ description: 'Exam Subject UUID' })
  @IsNotEmpty()
  @IsUUID()
  examSubjectId: string;

  @ApiProperty({ type: [StudentMarkItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentMarkItemDto)
  marks: StudentMarkItemDto[];
}
