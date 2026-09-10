import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { BulkEnterMarksDto } from './dto/enter-marks.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/auth-metadata.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Exams & Marks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exams')
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  @Get()
  @ApiOperation({ summary: 'List all exams for the school', description: 'Returns term assessments, periodic tests, and annual examinations.' })
  @ApiResponse({ status: 200, description: 'Exams list retrieved' })
  getExams(@CurrentTenant() schoolId: string) {
    return this.examsService.getExams(schoolId);
  }

  @Get(':id/subjects')
  @ApiOperation({ summary: 'Get subject schedules and max marks for an exam' })
  @ApiParam({ name: 'id', description: 'Exam UUID' })
  @ApiResponse({ status: 200, description: 'Exam subject papers and schedules returned' })
  getExamSubjects(@Param('id') examId: string) {
    return this.examsService.getExamSubjects(examId);
  }

  @Get('subjects/:id/marks')
  @UseGuards(RolesGuard)
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get student marks list for an exam subject paper' })
  @ApiParam({ name: 'id', description: 'Exam Subject Paper UUID' })
  @ApiQuery({ name: 'sectionId', required: false, description: 'Optional Section UUID' })
  @ApiResponse({ status: 200, description: 'Marks register for exam paper returned' })
  getExamSubjectMarks(
    @Param('id') examSubjectId: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.examsService.getExamSubjectMarks(examSubjectId, sectionId);
  }

  @Post('marks/bulk')
  @UseGuards(RolesGuard)
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Bulk enter/update marks for students in an exam subject' })
  @ApiResponse({ status: 201, description: 'Student marks entered and grades computed' })
  enterMarks(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkEnterMarksDto,
  ) {
    return this.examsService.enterMarksBulk(schoolId, user.userId, dto);
  }

  @Get('student/:studentId/report')
  @ApiOperation({ summary: 'Get student academic report card' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiQuery({ name: 'examId', required: false, description: 'Optional Exam UUID' })
  @ApiResponse({ status: 200, description: 'Student report card with marks, grades, and remarks returned' })
  getStudentReport(
    @Param('studentId') studentId: string,
    @Query('examId') examId?: string,
  ) {
    return this.examsService.getStudentReportCard(studentId, examId);
  }
}
