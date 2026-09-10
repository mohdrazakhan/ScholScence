import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AcademicsService } from './academics.service';
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
  @ApiOperation({ summary: 'List classes and their active sections' })
  getClasses(@CurrentTenant() schoolId: string) {
    return this.academicsService.getClasses(schoolId);
  }

  @Get('sections')
  @ApiOperation({ summary: 'List sections with optional classId filter' })
  @ApiQuery({ name: 'classId', required: false })
  getSections(@CurrentTenant() schoolId: string, @Query('classId') classId?: string) {
    return this.academicsService.getSections(schoolId, classId);
  }

  @Get('subjects')
  @ApiOperation({ summary: 'List all school subjects' })
  getSubjects(@CurrentTenant() schoolId: string) {
    return this.academicsService.getSubjects(schoolId);
  }

  @Post('subjects')
  @ApiOperation({ summary: 'Create a new subject in the curriculum' })
  createSubject(
    @CurrentTenant() schoolId: string,
    @Body() dto: { name: string; code: string; subjectType?: string; description?: string },
  ) {
    return this.academicsService.createSubject(schoolId, dto);
  }

  @Delete('subjects/:id')
  @ApiOperation({ summary: 'Remove/archive a subject' })
  deleteSubject(
    @CurrentTenant() schoolId: string,
    @Param('id') subjectId: string,
  ) {
    return this.academicsService.deleteSubject(schoolId, subjectId);
  }

  @Get('classes/:classId/subjects')
  @ApiOperation({ summary: 'List subjects mapped to a specific class' })
  getClassSubjects(@Param('classId') classId: string) {
    return this.academicsService.getClassSubjects(classId);
  }

  @Get('sections/:sectionId/students')
  @ApiOperation({ summary: 'List enrolled students in a specific section' })
  getStudentsBySection(@Param('sectionId') sectionId: string) {
    return this.academicsService.getStudentsBySection(sectionId);
  }

  @Get('teacher-assignments')
  @ApiOperation({ summary: 'List subject teacher assignments' })
  getTeacherAssignments(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // If teacher role, return only their assignments, otherwise all
    const userId = user.role === 'TEACHER' ? user.userId : undefined;
    return this.academicsService.getTeacherAssignments(schoolId, userId);
  }
}
