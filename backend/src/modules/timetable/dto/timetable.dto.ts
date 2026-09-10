import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SlotType {
  ACADEMIC = 'ACADEMIC',
  BREAK = 'BREAK',
  LUNCH = 'LUNCH',
  ASSEMBLY = 'ASSEMBLY',
  SPORTS = 'SPORTS',
  LIBRARY = 'LIBRARY',
  ACTIVITY = 'ACTIVITY',
}

export class CreateTimetablePeriodDto {
  @ApiProperty({ description: 'Section ID (UUID)' })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ description: 'Day of week (1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday)', minimum: 1, maximum: 6 })
  @IsInt()
  @Min(1)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ description: 'Period number in sequence (1, 2, 3, etc.)', minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  periodNumber: number;

  @ApiProperty({ description: 'Start time in HH:mm format', example: '08:30' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'End time in HH:mm format', example: '09:15' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ enum: SlotType, default: SlotType.ACADEMIC })
  @IsEnum(SlotType)
  slotType: SlotType;

  @ApiPropertyOptional({ description: 'Title for non-academic slots like Morning Assembly, Recess, Lunch Break', example: 'Recess Break' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Class Subject ID (UUID) for academic slots' })
  @IsString()
  @IsOptional()
  classSubjectId?: string;

  @ApiPropertyOptional({ description: 'Teacher User ID (UUID)' })
  @IsString()
  @IsOptional()
  teacherId?: string;

  @ApiPropertyOptional({ description: 'Classroom / Lab number', example: 'Room 204' })
  @IsString()
  @IsOptional()
  roomNumber?: string;
}

export class BulkUpsertTimetableDto {
  @ApiProperty({ type: [CreateTimetablePeriodDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTimetablePeriodDto)
  periods: CreateTimetablePeriodDto[];
}
