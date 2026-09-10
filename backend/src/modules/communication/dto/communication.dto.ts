import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TargetAudienceEnum {
  ALL = 'ALL',
  TEACHERS = 'TEACHERS',
  PARENTS = 'PARENTS',
  STUDENTS = 'STUDENTS',
}

export class CreateNoticeDto {
  @ApiProperty({ description: 'Title of the notice/circular', example: 'Annual Sports Meet 2026 - Schedule & Registration' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Full announcement body / content', example: 'The Annual Sports Meet will be held on Oct 15-16. All students are invited to register with physical education teachers.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ enum: TargetAudienceEnum, default: TargetAudienceEnum.ALL, description: 'Target audience for broadcast' })
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiPropertyOptional({ description: 'Expiration date timestamp', example: '2026-10-31T23:59:59Z' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class CreateEventDto {
  @ApiProperty({ description: 'Title of the school event or holiday', example: 'Parent-Teacher Conference (PTM - Term 1)' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Description / agenda of the event', example: 'Discussion of Term 1 assessment marks and progress cards.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Start date and time (ISO format)', example: '2026-09-25T09:00:00Z' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'End date and time (ISO format)', example: '2026-09-25T14:00:00Z' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ description: 'Location or venue', example: 'Main Auditorium & Classrooms' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Whether this event is a school holiday', default: false })
  @IsOptional()
  @IsBoolean()
  isHoliday?: boolean;

  @ApiPropertyOptional({ enum: TargetAudienceEnum, default: TargetAudienceEnum.ALL, description: 'Target audience group' })
  @IsOptional()
  @IsString()
  targetAudience?: string;
}
