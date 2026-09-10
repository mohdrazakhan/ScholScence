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
