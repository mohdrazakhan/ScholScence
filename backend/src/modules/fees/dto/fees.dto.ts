import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeeCategoryDto {
  @ApiProperty({ description: 'Category name (e.g. Tuition, Lab, Sports, Bus)' })
  name: string;

  @ApiPropertyOptional({ description: 'Description of category' })
  description?: string;
}

export class CreateFeeStructureDto {
  @ApiPropertyOptional({ description: 'Academic Year / Session ID (UUID). Defaults to active session.' })
  academicYearId?: string;

  @ApiProperty({ description: 'Class Grade ID (UUID)' })
  classId: string;

  @ApiProperty({ description: 'Fee Category ID (UUID)' })
  feeCategoryId: string;

  @ApiProperty({ description: 'Amount in INR', example: 2500.00 })
  amount: number;

  @ApiPropertyOptional({ description: 'Billing frequency', enum: ['MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONE_TIME'], default: 'MONTHLY' })
  frequency?: string;

  @ApiPropertyOptional({ description: 'Due day of the month', default: 10 })
  dueDay?: number;
}

export class GenerateBatchInvoicesDto {
  @ApiPropertyOptional({ description: 'Target Academic Year / Session ID' })
  academicYearId?: string;

  @ApiProperty({ description: 'Billing period name (e.g. April 2026)', example: 'April 2026' })
  monthName: string;

  @ApiProperty({ description: 'Payment due date', example: '2026-04-15' })
  dueDate: string;
}

export class CollectFeePaymentDto {
  @ApiProperty({ description: 'Target Student Fee Invoice ID' })
  invoiceId: string;

  @ApiProperty({ description: 'Amount collected in INR', example: 2500.00 })
  amountPaid: number;

  @ApiProperty({ description: 'Payment mode', enum: ['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CHEQUE'], default: 'UPI' })
  paymentMode: string;

  @ApiPropertyOptional({ description: 'Transaction / UTR Reference number' })
  transactionReference?: string;

  @ApiPropertyOptional({ description: 'Receipt counter remarks' })
  remarks?: string;
}
