import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'schoolsense_jwt_super_secret_key_2026_secure'),
    });
  }

  async validate(payload: any): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        user_school_roles: {
          where: { school_id: payload.schoolId, status: 'ACTIVE', deleted_at: null },
          include: {
            role: {
              include: {
                role_permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
            school: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE' || user.deleted_at !== null) {
      throw new UnauthorizedException('User account is invalid or deactivated');
    }

    const schoolRole = user.user_school_roles[0];
    if (!schoolRole) {
      throw new UnauthorizedException('User has no active membership in this school');
    }

    const permissions = schoolRole.role.role_permissions.map((rp) => rp.permission.code);

    return {
      userId: user.id,
      email: user.email || '',
      firstName: user.first_name,
      lastName: user.last_name || undefined,
      schoolId: schoolRole.school_id,
      schoolCode: schoolRole.school.code,
      role: schoolRole.role.code,
      permissions,
    };
  }
}
