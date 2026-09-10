import { Controller, Post, Get, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ComplaintsService, CreateComplaintDto, AddMessageDto } from './complaints.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Complaints / Grievances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('complaints')
export class ComplaintsController {
  constructor(private complaintsService: ComplaintsService) {}

  @Get()
  @ApiOperation({ summary: 'List complaint tickets based on user role and filters' })
  @ApiQuery({ name: 'scope', required: false })
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({ name: 'sectionId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'category', required: false })
  getComplaints(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('scope') scope?: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.complaintsService.getComplaints(schoolId, user, {
      scope,
      classId,
      sectionId,
      status,
      category,
    });
  }

  @Get('my-children')
  @ApiOperation({ summary: 'Get list of enrolled children for the logged-in parent' })
  getMyChildren(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.complaintsService.getMyChildren(schoolId, user.userId);
  }

  @Get('faculty')
  @ApiOperation({ summary: 'List teachers and faculty for ticket delegation' })
  getFaculty(@CurrentTenant() schoolId: string) {
    return this.complaintsService.getFaculty(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complaint ticket details and message thread' })
  getComplaintById(@Param('id') id: string) {
    return this.complaintsService.getComplaintById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a new complaint ticket' })
  createComplaint(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateComplaintDto,
  ) {
    return this.complaintsService.createComplaint(schoolId, user.userId, dto);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add a message or reply to a complaint thread' })
  addMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddMessageDto,
  ) {
    return this.complaintsService.addMessage(id, user.userId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.complaintsService.updateStatus(id, status);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Delegate or assign complaint ticket to a faculty member' })
  assignComplaint(
    @Param('id') id: string,
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { assignedTo: string | null; note?: string },
  ) {
    return this.complaintsService.assignComplaint(id, schoolId, user, dto.assignedTo, dto.note);
  }
}

