import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateHomeworkDto {
  @ApiProperty({ description: 'Section UUID' })
  @IsNotEmpty()
  @IsUUID()
  sectionId: string;

  @ApiProperty({ description: 'Class Subject UUID' })
  @IsNotEmpty()
  @IsUUID()
  classSubjectId: string;

  @ApiProperty({ example: 'Chapter 4: Linear Equations Homework' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Complete Exercises 4.1 & 4.2 in your homework notebook.' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: '2026-09-15', description: 'Due date in YYYY-MM-DD' })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @ApiProperty({ required: false, example: 'https://schoolsense-files.s3.amazonaws.com/hw1.pdf' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiProperty({ required: false, example: 'homework_sheet.pdf' })
  @IsOptional()
  @IsString()
  attachmentFileName?: string;
}
