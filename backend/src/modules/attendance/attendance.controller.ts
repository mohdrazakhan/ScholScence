import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { BulkMarkAttendanceDto } from './dto/mark-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequireService } from '../../common/decorators/auth-metadata.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireService('ATTENDANCE')
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk mark student attendance for a section and date', description: 'Allows teachers and administrators to submit daily or period attendance records for an entire section.' })
  @ApiResponse({ status: 201, description: 'Attendance records successfully saved and synced' })
  bulkMark(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkMarkAttendanceDto,
  ) {
    return this.attendanceService.bulkMarkAttendance(schoolId, user.userId, dto);
  }

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'Get attendance register for a section on a given date' })
  @ApiParam({ name: 'sectionId', description: 'Section UUID' })
  @ApiQuery({ name: 'date', required: false, example: '2026-09-10', description: 'Target date (YYYY-MM-DD), defaults to today' })
  @ApiResponse({ status: 200, description: 'Attendance register and student status summary returned' })
  getSectionAttendance(
    @CurrentTenant() schoolId: string,
    @Param('sectionId') sectionId: string,
    @Query('date') date?: string,
  ) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.attendanceService.getSectionAttendance(schoolId, sectionId, targetDate);
  }

  @Get('my-children')
  @ApiOperation({ summary: 'Get live child attendance with subject breakdown for logged-in parent', description: 'Returns dynamic child statistics, daily register logs with real teacher markings, and course-by-course attendance rates.' })
  @ApiQuery({ name: 'studentId', required: false, description: 'Optional child student UUID if parent has multiple children' })
  @ApiResponse({ status: 200, description: 'Parent child attendance diary and subject breakdown returned' })
  getMyChildren(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('studentId') studentId?: string,
  ) {
    return this.attendanceService.getMyChildrenAttendance(schoolId, user.userId, studentId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get student attendance summary and history by student ID' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiQuery({ name: 'month', required: false, description: 'Month in YYYY-MM format' })
  @ApiResponse({ status: 200, description: 'Student attendance logs retrieved' })
  getStudentAttendance(
    @Param('studentId') studentId: string,
    @Query('month') month?: string,
  ) {
    return this.attendanceService.getStudentAttendance(studentId, month);
  }
}
