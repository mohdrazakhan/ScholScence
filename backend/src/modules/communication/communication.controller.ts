import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommunicationService, CreateNoticeDto, CreateEventDto } from './communication.service';
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
  @ApiOperation({ summary: 'List notices for current school' })
  getNotices(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.communicationService.getNotices(schoolId, user.role);
  }

  @Post('notices')
  @ApiOperation({ summary: 'Create and broadcast a new notice' })
  createNotice(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNoticeDto,
  ) {
    return this.communicationService.createNotice(schoolId, user.userId, dto);
  }

  @Get('events')
  @ApiOperation({ summary: 'List calendar events and school holidays' })
  getEvents(@CurrentTenant() schoolId: string) {
    return this.communicationService.getEvents(schoolId);
  }

  @Post('events')
  @ApiOperation({ summary: 'Create a new school event' })
  createEvent(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEventDto,
  ) {
    return this.communicationService.createEvent(schoolId, user.userId, dto);
  }
}
