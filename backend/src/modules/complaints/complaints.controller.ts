import { Controller, Post, Get, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import {
  CreateComplaintDto,
  AddMessageDto,
  UpdateStatusDto,
  AssignComplaintDto,
  ComplaintFilterDto,
} from './dto/complaints.dto';
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
  @ApiOperation({ summary: 'List complaint tickets based on user role and filters', description: 'Strictly isolated by role: Parents see only their tickets; Teachers see assigned or class teacher tickets; Admins/Principals see school tickets by class.' })
  @ApiQuery({ name: 'scope', required: false, description: 'Teacher scope: CLASS_TEACHER | ASSIGNED | ALL' })
  @ApiQuery({ name: 'classId', required: false, description: 'Class UUID filter' })
  @ApiQuery({ name: 'sectionId', required: false, description: 'Section UUID filter' })
  @ApiQuery({ name: 'status', required: false, description: 'OPEN | IN_PROGRESS | RESOLVED | CLOSED' })
  @ApiQuery({ name: 'category', required: false, description: 'ACADEMIC | BEHAVIOR | FACILITIES | TRANSPORT | FEES | BULLYING | OTHER' })
  @ApiResponse({ status: 200, description: 'Filtered complaint tickets returned' })
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
  @ApiResponse({ status: 200, description: 'Children list returned' })
  getMyChildren(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.complaintsService.getMyChildren(schoolId, user.userId);
  }

  @Get('faculty')
  @ApiOperation({ summary: 'List teachers and faculty for ticket delegation' })
  @ApiResponse({ status: 200, description: 'Faculty staff list returned' })
  getFaculty(@CurrentTenant() schoolId: string) {
    return this.complaintsService.getFaculty(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complaint ticket details and message thread' })
  @ApiParam({ name: 'id', description: 'Complaint Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket details and timeline messages returned' })
  getComplaintById(@Param('id') id: string) {
    return this.complaintsService.getComplaintById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a new complaint ticket (Parent / Guardian)' })
  @ApiResponse({ status: 201, description: 'Ticket created and assigned ticket number' })
  createComplaint(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateComplaintDto,
  ) {
    return this.complaintsService.createComplaint(schoolId, user.userId, dto);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add a message or reply to a complaint thread' })
  @ApiParam({ name: 'id', description: 'Complaint Ticket UUID' })
  @ApiResponse({ status: 201, description: 'Message added to thread' })
  addMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddMessageDto,
  ) {
    return this.complaintsService.addMessage(id, user.userId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)' })
  @ApiParam({ name: 'id', description: 'Complaint Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.complaintsService.updateStatus(id, dto.status);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Delegate or assign complaint ticket to a faculty member' })
  @ApiParam({ name: 'id', description: 'Complaint Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket assignment updated' })
  assignComplaint(
    @Param('id') id: string,
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssignComplaintDto,
  ) {
    return this.complaintsService.assignComplaint(id, schoolId, user, dto.assignedTo, dto.note);
  }
}
