import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
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
}
