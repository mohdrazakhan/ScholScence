import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequireService } from '../../common/decorators/auth-metadata.decorator';
import {
  CreateFeeCategoryDto,
  CreateFeeStructureDto,
  GenerateBatchInvoicesDto,
  CollectFeePaymentDto,
} from './dto/fees.dto';

@ApiTags('Fees & Invoicing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireService('FEES')
@Controller('fees')
export class FeesController {
  @Get('overview')
  @ApiOperation({ summary: 'Get Session-Scoped Fee Financial Overview & Metrics' })
  @ApiQuery({ name: 'academicYearId', required: false, description: 'Academic Session ID' })
  @ApiResponse({ status: 200, description: 'Financial collection stats returned' })
  getOverview(
    @CurrentTenant() schoolId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return { success: true, schoolId, academicYearId };
  }

  @Get('categories')
  @ApiOperation({ summary: 'List Institutional Fee Categories & Heads' })
  @ApiResponse({ status: 200, description: 'Fee categories returned' })
  getCategories(@CurrentTenant() schoolId: string) {
    return { success: true, schoolId };
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create Fee Category' })
  @ApiResponse({ status: 201, description: 'Fee category created' })
  createCategory(
    @CurrentTenant() schoolId: string,
    @Body() dto: CreateFeeCategoryDto,
  ) {
    return { success: true, schoolId, ...dto };
  }

  @Get('structures')
  @ApiOperation({ summary: 'Get Session-Scoped Fee Structures per Class' })
  @ApiQuery({ name: 'academicYearId', required: false, description: 'Academic Session ID' })
  @ApiQuery({ name: 'classId', required: false, description: 'Class ID' })
  @ApiResponse({ status: 200, description: 'Fee structures returned' })
  getStructures(
    @CurrentTenant() schoolId: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('classId') classId?: string,
  ) {
    return { success: true, schoolId, academicYearId, classId };
  }

  @Post('structures')
  @ApiOperation({ summary: 'Create Session-Scoped Fee Structure' })
  @ApiResponse({ status: 201, description: 'Fee structure configured' })
  createStructure(
    @CurrentTenant() schoolId: string,
    @Body() dto: CreateFeeStructureDto,
  ) {
    return { success: true, schoolId, ...dto };
  }

  @Patch('structures/:id')
  @ApiOperation({ summary: 'Update Fee Structure' })
  @ApiParam({ name: 'id', description: 'Fee structure ID' })
  updateStructure(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return { success: true, id, ...body };
  }

  @Delete('structures/:id')
  @ApiOperation({ summary: 'Remove Fee Structure' })
  @ApiParam({ name: 'id', description: 'Fee structure ID' })
  deleteStructure(@Param('id') id: string) {
    return { success: true, id };
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get Student Fee Invoices & Ledger' })
  @ApiQuery({ name: 'academicYearId', required: false, description: 'Academic Session ID' })
  @ApiQuery({ name: 'studentId', required: false, description: 'Student ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Payment Status' })
  getInvoices(
    @CurrentTenant() schoolId: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    return { success: true, schoolId, academicYearId, studentId, status };
  }

  @Post('invoices/generate-batch')
  @ApiOperation({ summary: 'Run Automated Monthly Billing Run for Session' })
  @ApiResponse({ status: 201, description: 'Invoices batch created' })
  generateBatchInvoices(
    @CurrentTenant() schoolId: string,
    @Body() dto: GenerateBatchInvoicesDto,
  ) {
    return { success: true, schoolId, ...dto };
  }

  @Post('payments')
  @ApiOperation({ summary: 'Collect Fee Payment and Issue Official Receipt' })
  @ApiResponse({ status: 201, description: 'Payment recorded and receipt created' })
  collectPayment(
    @CurrentTenant() schoolId: string,
    @Body() dto: CollectFeePaymentDto,
  ) {
    return { success: true, schoolId, ...dto };
  }
}
