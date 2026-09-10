import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@demo-school.com', description: 'User email or phone' })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ example: 'DIS001', required: false, description: 'School Code (optional if single school)' })
  schoolCode?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token string' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
