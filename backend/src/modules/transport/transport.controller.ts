import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequireService } from '../../common/decorators/auth-metadata.decorator';
import {
  CreateTransportVehicleDto,
  CreateTransportRouteDto,
  AssignTransportPassDto,
} from './dto/transport.dto';

@ApiTags('Transport & Fleet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireService('TRANSPORT')
@Controller('transport')
export class TransportController {
  @Get('overview')
  @ApiOperation({ summary: 'Get Transport Fleet Logistics & Route Overview' })
  @ApiQuery({ name: 'academicYearId', required: false, description: 'Academic Session ID' })
  @ApiResponse({ status: 200, description: 'Fleet capacity and transport occupancy metrics returned' })
  getOverview(
    @CurrentTenant() schoolId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return { success: true, schoolId, academicYearId };
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'List School Fleet Vehicles' })
  @ApiResponse({ status: 200, description: 'Fleet vehicles returned' })
  getVehicles(@CurrentTenant() schoolId: string) {
    return { success: true, schoolId };
  }

  @Post('vehicles')
  @ApiOperation({ summary: 'Add Fleet Vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle registered' })
  createVehicle(
    @CurrentTenant() schoolId: string,
    @Body() dto: CreateTransportVehicleDto,
  ) {
    return { success: true, schoolId, ...dto };
  }

  @Patch('vehicles/:id')
  @ApiOperation({ summary: 'Update Vehicle Details & Driver Info' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  updateVehicle(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return { success: true, id, ...body };
  }

  @Delete('vehicles/:id')
  @ApiOperation({ summary: 'Decommission Fleet Vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  deleteVehicle(@Param('id') id: string) {
    return { success: true, id };
  }

  @Get('routes')
  @ApiOperation({ summary: 'Get Session-Scoped Transport Bus Routes & Stops' })
  @ApiQuery({ name: 'academicYearId', required: false, description: 'Academic Session ID' })
  @ApiResponse({ status: 200, description: 'Session routes returned' })
  getRoutes(
    @CurrentTenant() schoolId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return { success: true, schoolId, academicYearId };
  }

  @Post('routes')
  @ApiOperation({ summary: 'Create Session-Scoped Transport Route & Stops' })
  @ApiResponse({ status: 201, description: 'Route and stops itinerary saved' })
  createRoute(
    @CurrentTenant() schoolId: string,
    @Body() dto: CreateTransportRouteDto,
  ) {
    return { success: true, schoolId, ...dto };
  }

  @Patch('routes/:id')
  @ApiOperation({ summary: 'Update Transport Route Schedule' })
  @ApiParam({ name: 'id', description: 'Route ID' })
  updateRoute(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return { success: true, id, ...body };
  }

  @Delete('routes/:id')
  @ApiOperation({ summary: 'Delete Transport Route' })
  @ApiParam({ name: 'id', description: 'Route ID' })
  deleteRoute(@Param('id') id: string) {
    return { success: true, id };
  }

  @Get('assignments')
  @ApiOperation({ summary: 'Get Student Transport Bus Subscriptions & Passes for Session' })
  @ApiQuery({ name: 'academicYearId', required: false, description: 'Academic Session ID' })
  @ApiQuery({ name: 'routeId', required: false, description: 'Route ID' })
  @ApiQuery({ name: 'studentId', required: false, description: 'Student ID' })
  getAssignments(
    @CurrentTenant() schoolId: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('routeId') routeId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return { success: true, schoolId, academicYearId, routeId, studentId };
  }

  @Post('assignments')
  @ApiOperation({ summary: 'Issue Student Bus Pass for Academic Session' })
  @ApiResponse({ status: 201, description: 'Bus pass issued' })
  createAssignment(
    @CurrentTenant() schoolId: string,
    @Body() dto: AssignTransportPassDto,
  ) {
    return { success: true, schoolId, ...dto };
  }

  @Delete('assignments/:id')
  @ApiOperation({ summary: 'Cancel Student Bus Pass Subscription' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  deleteAssignment(@Param('id') id: string) {
    return { success: true, id };
  }
}
