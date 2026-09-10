import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CommunicationService } from './communication.service';
import { CreateNoticeDto, CreateEventDto } from './dto/communication.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Communication')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('communication')
export class CommunicationController {
  constructor(private communicationService: CommunicationService) {}

  @Get('notices')
  @ApiOperation({ summary: 'List notices for current school', description: 'Returns circulars filtered by the target audience and user role.' })
  @ApiResponse({ status: 200, description: 'Notices list retrieved successfully' })
  getNotices(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.communicationService.getNotices(schoolId, user.role);
  }

  @Post('notices')
  @ApiOperation({ summary: 'Create and broadcast a new notice circular' })
  @ApiResponse({ status: 201, description: 'Notice published' })
  createNotice(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNoticeDto,
  ) {
    return this.communicationService.createNotice(schoolId, user.userId, dto);
  }

  @Get('events')
  @ApiOperation({ summary: 'List calendar events and school holidays' })
  @ApiResponse({ status: 200, description: 'Academic events and holidays retrieved' })
  getEvents(@CurrentTenant() schoolId: string) {
    return this.communicationService.getEvents(schoolId);
  }

  @Post('events')
  @ApiOperation({ summary: 'Create a new calendar event or holiday' })
  @ApiResponse({ status: 201, description: 'Event added to school calendar' })
  createEvent(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEventDto,
  ) {
    return this.communicationService.createEvent(schoolId, user.userId, dto);
  }
}
