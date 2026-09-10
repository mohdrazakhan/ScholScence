import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SwitchSchoolDto } from '../schools/dto/schools.dto';
import { Public } from '../../common/decorators/auth-metadata.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email/phone, password and optional school code' })
  @ApiResponse({ status: 200, description: 'Authentication successful with JWT tokens and user profile' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile, permissions, and scoped assignments' })
  @ApiResponse({ status: 200, description: 'Profile returned' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.userId, user.schoolId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('switch-school')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch active campus context (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'New JWT token and profile for target school returned' })
  async switchSchool(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SwitchSchoolDto,
  ) {
    return this.authService.switchSchool(user, dto.schoolId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('impersonate-admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in directly as School Admin of target school (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'School Admin session and token returned' })
  async impersonateAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SwitchSchoolDto,
  ) {
    return this.authService.impersonateSchoolAdmin(user, dto.schoolId);
  }
}
