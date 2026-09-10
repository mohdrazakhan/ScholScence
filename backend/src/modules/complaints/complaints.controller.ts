import { Controller, Post, Get, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'List complaint tickets' })
  getComplaints(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.complaintsService.getComplaints(schoolId);
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
}
