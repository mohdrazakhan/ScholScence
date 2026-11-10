import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransportVehicleDto {
  @ApiProperty({ description: 'Registration Number', example: 'DL-01-AB-1004' })
  vehicleNumber: string;

  @ApiPropertyOptional({ description: 'Display Bus Number', example: 'Bus #04' })
  busNumber?: string;

  @ApiPropertyOptional({ description: 'Vehicle type', enum: ['BUS', 'VAN', 'MINI_BUS'], default: 'BUS' })
  vehicleType?: string;

  @ApiPropertyOptional({ description: 'Vehicle model', example: 'Tata Starbus 40S' })
  model?: string;

  @ApiPropertyOptional({ description: 'Total seating capacity', default: 40 })
  seatingCapacity?: number;

  @ApiProperty({ description: 'Driver Full Name', example: 'Sunil Kumar' })
  driverName: string;

  @ApiProperty({ description: 'Driver Contact Phone', example: '+91 98104 56789' })
  driverPhone: string;

  @ApiPropertyOptional({ description: 'Conductor / Attendant Name' })
  conductorName?: string;

  @ApiPropertyOptional({ description: 'Live GPS device tracking ID' })
  gpsDeviceId?: string;
}

export class RouteStopItemDto {
  @ApiProperty({ description: 'Stop Name', example: 'Sector 15 Community Center' })
  stop_name: string;

  @ApiProperty({ description: 'Pickup Time', example: '07:05 AM' })
  pickup_time: string;

  @ApiProperty({ description: 'Drop Time', example: '03:10 PM' })
  drop_time: string;

  @ApiPropertyOptional({ description: 'Stop Sequence Order', default: 1 })
  sequence_order?: number;

  @ApiProperty({ description: 'Monthly Transport Fare in INR', example: 1350.00 })
  monthly_fare: number;

  @ApiPropertyOptional({ description: 'Landmark / Cross street' })
  landmark?: string;
}

export class CreateTransportRouteDto {
  @ApiPropertyOptional({ description: 'Academic Year / Session ID (UUID). Defaults to active session.' })
  academicYearId?: string;

  @ApiProperty({ description: 'Route Name', example: 'Route 3: Rohini Sector 15 Express' })
  name: string;

  @ApiProperty({ description: 'Route Code', example: 'RT-03' })
  code: string;

  @ApiProperty({ description: 'Assigned Vehicle ID (UUID)' })
  vehicleId: string;

  @ApiPropertyOptional({ description: 'Morning Start Time', default: '06:45 AM' })
  morningStartTime?: string;

  @ApiPropertyOptional({ description: 'Evening Start Time', default: '02:30 PM' })
  eveningStartTime?: string;

  @ApiPropertyOptional({ description: 'Route coverage description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Itinerary stops array', type: [RouteStopItemDto] })
  stops?: RouteStopItemDto[];
}

export class AssignTransportPassDto {
  @ApiPropertyOptional({ description: 'Academic Year / Session ID (UUID). Defaults to active session.' })
  academicYearId?: string;

  @ApiProperty({ description: 'Student ID (UUID)' })
  studentId: string;

  @ApiProperty({ description: 'Transport Route ID (UUID)' })
  routeId: string;

  @ApiProperty({ description: 'Route Stop ID (UUID)' })
  stopId: string;

  @ApiPropertyOptional({ description: 'Allocated Seat Number', example: 'S-18' })
  seatNumber?: string;

  @ApiPropertyOptional({ description: 'Emergency Contact Phone', example: '+91 98765 43210' })
  emergencyContact?: string;
}
