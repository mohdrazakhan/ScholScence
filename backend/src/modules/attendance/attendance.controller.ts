import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { BulkMarkAttendanceDto } from './dto/mark-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk mark student attendance for a section and date' })
  bulkMark(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkMarkAttendanceDto,
  ) {
    return this.attendanceService.bulkMarkAttendance(schoolId, user.userId, dto);
  }

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'Get attendance register for a section on a given date (defaults to today)' })
  @ApiQuery({ name: 'date', required: false, example: '2026-09-10' })
  getSectionAttendance(
    @CurrentTenant() schoolId: string,
    @Param('sectionId') sectionId: string,
    @Query('date') date?: string,
  ) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.attendanceService.getSectionAttendance(schoolId, sectionId, targetDate);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get student attendance summary and history (Parent/Student view)' })
  @ApiQuery({ name: 'month', required: false })
  getStudentAttendance(
    @Param('studentId') studentId: string,
    @Query('month') month?: string,
  ) {
    return this.attendanceService.getStudentAttendance(studentId, month);
  }
}
