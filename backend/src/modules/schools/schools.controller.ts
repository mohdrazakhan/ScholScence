import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'List all active schools for public directory and login portal' })
  getPublicSchools() {
    return this.schoolsService.getPublicSchools();
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant school profile and configurations' })
  getCurrentSchool(@CurrentTenant() schoolId: string) {
    return this.schoolsService.getCurrentSchool(schoolId);
  }

  @Get('academic-years')
  @ApiOperation({ summary: 'List academic years for current school' })
  getAcademicYears(@CurrentTenant() schoolId: string) {
    return this.schoolsService.getAcademicYears(schoolId);
  }

  @Get('branches')
  @ApiOperation({ summary: 'List campuses/branches for current school' })
  getBranches(@CurrentTenant() schoolId: string) {
    return this.schoolsService.getBranches(schoolId);
  }
}
