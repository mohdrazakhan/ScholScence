import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AcademicsService } from './academics.service';
import { CreateSubjectDto } from './dto/academics.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Academics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academics')
export class AcademicsController {
  constructor(private academicsService: AcademicsService) {}

  @Get('classes')
  @ApiOperation({ summary: 'List all classes and their active sections', description: 'Returns academic classes with nested sections for the current school.' })
  @ApiResponse({ status: 200, description: 'Classes and sections retrieved successfully' })
  getClasses(@CurrentTenant() schoolId: string) {
    return this.academicsService.getClasses(schoolId);
  }

  @Get('sections')
  @ApiOperation({ summary: 'List sections with optional classId filter' })
  @ApiQuery({ name: 'classId', required: false, description: 'Optional UUID of the class to filter sections' })
  @ApiResponse({ status: 200, description: 'Sections retrieved successfully' })
  getSections(@CurrentTenant() schoolId: string, @Query('classId') classId?: string) {
    return this.academicsService.getSections(schoolId, classId);
  }

  @Get('subjects')
  @ApiOperation({ summary: 'List all subjects in school curriculum' })
  @ApiResponse({ status: 200, description: 'Subjects retrieved successfully' })
  getSubjects(@CurrentTenant() schoolId: string) {
    return this.academicsService.getSubjects(schoolId);
  }

  @Post('subjects')
  @ApiOperation({ summary: 'Create a new subject in the curriculum' })
  @ApiResponse({ status: 201, description: 'Subject created successfully' })
  createSubject(
    @CurrentTenant() schoolId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.academicsService.createSubject(schoolId, dto);
  }

  @Delete('subjects/:id')
  @ApiOperation({ summary: 'Remove or archive a subject from curriculum' })
  @ApiParam({ name: 'id', description: 'Subject UUID' })
  @ApiResponse({ status: 200, description: 'Subject removed successfully' })
  deleteSubject(
    @CurrentTenant() schoolId: string,
    @Param('id') subjectId: string,
  ) {
    return this.academicsService.deleteSubject(schoolId, subjectId);
  }

  @Get('classes/:classId/subjects')
  @ApiOperation({ summary: 'List subjects mapped to a specific class' })
  @ApiParam({ name: 'classId', description: 'Class UUID' })
  @ApiResponse({ status: 200, description: 'Mapped class subjects retrieved' })
  getClassSubjects(@Param('classId') classId: string) {
    return this.academicsService.getClassSubjects(classId);
  }

  @Get('sections/:sectionId/students')
  @ApiOperation({ summary: 'List enrolled students roster in a specific section' })
  @ApiParam({ name: 'sectionId', description: 'Section UUID' })
  @ApiResponse({ status: 200, description: 'Student roster retrieved successfully' })
  getStudentsBySection(@Param('sectionId') sectionId: string) {
    return this.academicsService.getStudentsBySection(sectionId);
  }

  @Get('teacher-assignments')
  @ApiOperation({ summary: 'List subject and class teacher allocations across sections' })
  @ApiResponse({ status: 200, description: 'Teaching allocations retrieved' })
  getTeacherAssignments(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const userId = user.role === 'TEACHER' ? user.userId : undefined;
    return this.academicsService.getTeacherAssignments(schoolId, userId);
  }
}
