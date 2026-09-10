import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { BulkEnterMarksDto } from './dto/enter-marks.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Exams & Marks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exams')
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  @Get()
  @ApiOperation({ summary: 'List all exams for the school' })
  getExams(@CurrentTenant() schoolId: string) {
    return this.examsService.getExams(schoolId);
  }

  @Get(':id/subjects')
  @ApiOperation({ summary: 'Get subject schedules and max marks for an exam' })
  getExamSubjects(@Param('id') examId: string) {
    return this.examsService.getExamSubjects(examId);
  }

  @Get('subjects/:id/marks')
  @ApiOperation({ summary: 'Get student marks list for an exam subject paper' })
  @ApiQuery({ name: 'sectionId', required: false })
  getExamSubjectMarks(
    @Param('id') examSubjectId: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.examsService.getExamSubjectMarks(examSubjectId, sectionId);
  }

  @Post('marks/bulk')
  @ApiOperation({ summary: 'Bulk enter/update marks for students in an exam subject' })
  enterMarks(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkEnterMarksDto,
  ) {
    return this.examsService.enterMarksBulk(schoolId, user.userId, dto);
  }

  @Get('student/:studentId/report')
  @ApiOperation({ summary: 'Get student academic report card' })
  @ApiQuery({ name: 'examId', required: false })
  getStudentReport(
    @Param('studentId') studentId: string,
    @Query('examId') examId?: string,
  ) {
    return this.examsService.getStudentReportCard(studentId, examId);
  }
}
