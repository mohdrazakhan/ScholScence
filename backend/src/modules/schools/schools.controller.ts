import { Controller, Get, Post, Patch, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import { OnboardSchoolDto, UpdateSchoolStatusDto, UpdateSchoolServicesDto } from './dto/schools.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/auth-metadata.decorator';

@ApiTags('Schools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schools')
export class SchoolsController {
  constructor(private schoolsService: SchoolsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'List all active schools for public directory and login portal', description: 'Returns public school names, codes, affiliations, and logos without authentication.' })
  @ApiResponse({ status: 200, description: 'Public school directory retrieved' })
  getPublicSchools() {
    return this.schoolsService.getPublicSchools();
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant school profile and configurations' })
  @ApiResponse({ status: 200, description: 'Tenant school profile returned' })
  getCurrentSchool(@CurrentTenant() schoolId: string) {
    return this.schoolsService.getCurrentSchool(schoolId);
  }

  @Get('academic-years')
  @ApiOperation({ summary: 'List academic years for current school' })
  @ApiResponse({ status: 200, description: 'Academic years list returned' })
  getAcademicYears(@CurrentTenant() schoolId: string) {
    return this.schoolsService.getAcademicYears(schoolId);
  }

  @Get('branches')
  @ApiOperation({ summary: 'List campuses/branches for current school' })
  @ApiResponse({ status: 200, description: 'School branch locations returned' })
  getBranches(@CurrentTenant() schoolId: string) {
    return this.schoolsService.getBranches(schoolId);
  }

  // ==========================================================================
  // SUPER ADMIN ONBOARDING, DEBOARDING & SERVICE RESTRICTIONS
  // ==========================================================================

  @Get('all')
  @ApiOperation({ summary: 'List all schools in network with live statistics (Super Admin only)', description: 'Returns all schools, active student/class/staff counts, and primary school administrator profiles.' })
  @ApiResponse({ status: 200, description: 'Complete school network directory retrieved' })
  getAllSchools(@CurrentUser() user: AuthenticatedUser) {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Only Company Developers / Super Admins can view the full school network.');
    }
    return this.schoolsService.getAllSchoolsWithStats();
  }

  @Post('onboard')
  @ApiOperation({ summary: 'Onboard a new school and provision initial School Administrator (Super Admin only)', description: 'Atomic creation of School, Branch, Academic Year, School Admin user, foundational classes, and curriculum subjects.' })
  @ApiResponse({ status: 201, description: 'School and School Administrator onboarded successfully' })
  onboardSchool(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OnboardSchoolDto,
  ) {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Only Company Developers / Super Admins can onboard new schools.');
    }
    return this.schoolsService.onboardSchool(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Deboard or reactivate an institution (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'School UUID' })
  @ApiResponse({ status: 200, description: 'School status updated' })
  updateSchoolStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') schoolId: string,
    @Body() dto: UpdateSchoolStatusDto,
  ) {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Only Company Developers / Super Admins can alter school activation status.');
    }
    return this.schoolsService.updateSchoolStatus(schoolId, dto.status);
  }

  @Patch(':id/services')
  @ApiOperation({ summary: 'Manage and restrict institutional community services (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'School UUID' })
  @ApiResponse({ status: 200, description: 'Service permissions updated' })
  updateSchoolServices(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') schoolId: string,
    @Body() dto: UpdateSchoolServicesDto,
  ) {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Only Company Developers / Super Admins can configure service restrictions.');
    }
    return this.schoolsService.updateSchoolServices(schoolId, dto.disabledServices || []);
  }
}
