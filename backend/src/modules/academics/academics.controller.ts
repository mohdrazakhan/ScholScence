import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AcademicsService } from './academics.service';
import { CreateSubjectDto, CreateStaffDto, CreateStudentDto } from './dto/academics.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RequireService } from '../../common/decorators/auth-metadata.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Academics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireService('ACADEMICS')
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
  @UseGuards(RolesGuard)
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'Create a new subject in the curriculum' })
  @ApiResponse({ status: 201, description: 'Subject created successfully' })
  createSubject(
    @CurrentTenant() schoolId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.academicsService.createSubject(schoolId, dto);
  }

  @Delete('subjects/:id')
  @UseGuards(RolesGuard)
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
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

  @Post('students')
  @UseGuards(RolesGuard)
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'Enroll a new child / student and link parents', description: 'Creates a student profile, enrolls in section, and links guardian contact.' })
  @ApiResponse({ status: 201, description: 'Student enrolled successfully' })
  createStudent(
    @CurrentTenant() schoolId: string,
    @Body() dto: CreateStudentDto,
  ) {
    return this.academicsService.createStudent(schoolId, dto);
  }

  @Get('staff')
  @ApiOperation({ summary: 'List all staff members (Principals, Teachers, Admins)', description: 'Returns institutional faculty directory with teaching & class assignments.' })
  @ApiResponse({ status: 200, description: 'Staff directory retrieved' })
  getStaff(@CurrentTenant() schoolId: string) {
    return this.academicsService.getStaff(schoolId);
  }

  @Post('staff')
  @UseGuards(RolesGuard)
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'Register a new Principal, Teacher, or Staff member', description: 'Creates user account with role, password, and optional class teacher / subject assignment.' })
  @ApiResponse({ status: 201, description: 'Staff registered successfully' })
  createStaff(
    @CurrentTenant() schoolId: string,
    @Body() dto: CreateStaffDto,
  ) {
    return this.academicsService.createStaff(schoolId, dto);
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
