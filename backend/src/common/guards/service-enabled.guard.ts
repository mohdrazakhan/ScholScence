import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SERVICE_KEY } from '../decorators/auth-metadata.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ServiceEnabledGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredService = this.reflector.getAllAndOverride<string>(SERVICE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredService) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    let user = request.user;

    // Fallback: If request.user has not yet been populated by an upstream guard, extract and decode Bearer token
    if (!user && request.headers.authorization) {
      const authHeader = request.headers.authorization as string;
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            user = {
              userId: decoded.sub,
              email: decoded.email,
              schoolId: decoded.schoolId,
              schoolCode: decoded.schoolCode,
              role: decoded.role,
            };
            request.user = user;
          }
        } catch {
          // Token decode failure, handled below
        }
      }
    }

    // 1. Super Admin root accounts have universal access across all services
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_ADMIN') {
      return true;
    }

    // 2. Identify School / Campus Context
    const schoolId = user?.schoolId || (request.headers['x-tenant-id'] as string);
    if (!schoolId) {
      throw new ForbiddenException('Access denied: No active school context found for service verification.');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        status: true,
        address_line2: true,
      },
    });

    if (!school) {
      throw new ForbiddenException('Institution not found');
    }

    if (school.status === 'SUSPENDED' || school.status === 'DEBOARDED') {
      throw new ForbiddenException(`School "${school.name}" has been ${school.status.toLowerCase()} by platform administration.`);
    }

    // 3. Check service restriction governance
    let disabledServices: string[] = [];
    if (school.address_line2) {
      try {
        const parsed = JSON.parse(school.address_line2);
        if (Array.isArray(parsed.disabledServices)) {
          disabledServices = parsed.disabledServices;
        }
      } catch {
        // Not a JSON payload, treat as no disabled services
      }
    }

    if (disabledServices.includes(requiredService)) {
      throw new ForbiddenException(
        `The "${requiredService}" service has been disabled for this institution by platform governance.`,
      );
    }

    return true;
  }
}
