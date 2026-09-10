import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get school overview KPIs, attendance metrics, and role-scoped analytics', description: 'Returns institutional metrics for Admins, teaching routine for Teachers, and child performance KPIs for Parents.' })
  @ApiResponse({ status: 200, description: 'Role-scoped dashboard overview returned' })
  getOverview(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dashboardService.getOverview(schoolId, user);
  }
}
