import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { CreateTimetablePeriodDto, BulkUpsertTimetableDto } from './dto/timetable.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Timetable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private timetableService: TimetableService) {}

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'Get complete weekly timetable for a class section', description: 'Returns all 6-day periods, start/end times, assigned subject teachers, and recess/break intervals.' })
  @ApiParam({ name: 'sectionId', description: 'Section UUID' })
  @ApiResponse({ status: 200, description: 'Weekly section timetable matrix returned' })
  getSectionTimetable(
    @CurrentTenant() schoolId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.timetableService.getSectionTimetable(schoolId, sectionId);
  }

  @Get('teacher')
  @ApiOperation({ summary: 'Get current teacher routine across all sections', description: 'Returns weekly teaching schedule with classroom locations for the authenticated teacher.' })
  @ApiResponse({ status: 200, description: 'Teacher teaching routine returned' })
  getTeacherTimetable(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timetableService.getTeacherTimetable(schoolId, user.userId);
  }

  @Get('my-child')
  @ApiOperation({ summary: 'Get timetable for parent logged in user', description: 'Returns enrolled child weekly schedule with break intervals and child switcher support.' })
  @ApiQuery({ name: 'studentId', required: false, description: 'Optional Student UUID if parent has multiple children' })
  @ApiResponse({ status: 200, description: 'Child weekly schedule returned' })
  getMyChildTimetable(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('studentId') studentId?: string,
  ) {
    return this.timetableService.getMyChildTimetable(schoolId, user.userId, studentId);
  }

  @Post('periods')
  @ApiOperation({ summary: 'Create or update a single timetable period or interval', description: 'Authorized for Principals, School Admins, and assigned Class Teachers.' })
  @ApiResponse({ status: 201, description: 'Period slot saved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions to modify timetable' })
  savePeriod(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTimetablePeriodDto,
  ) {
    return this.timetableService.savePeriod(schoolId, user, dto);
  }

  @Post('section/:sectionId/bulk')
  @ApiOperation({ summary: 'Bulk save or replace section weekly timetable' })
  @ApiParam({ name: 'sectionId', description: 'Section UUID' })
  @ApiResponse({ status: 200, description: 'Weekly timetable replaced successfully' })
  bulkSaveSectionTimetable(
    @CurrentTenant() schoolId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkUpsertTimetableDto,
  ) {
    return this.timetableService.bulkSaveSectionTimetable(schoolId, sectionId, user, dto);
  }

  @Delete('periods/:id')
  @ApiOperation({ summary: 'Delete a timetable period slot' })
  @ApiParam({ name: 'id', description: 'Timetable Period UUID' })
  @ApiResponse({ status: 200, description: 'Period slot removed' })
  deletePeriod(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') periodId: string,
  ) {
    return this.timetableService.deletePeriod(schoolId, periodId, user);
  }
}
