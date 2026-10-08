import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.schoolId || (request.headers?.['x-tenant-id'] as string) || request.query?.schoolId || '';
  },
);

