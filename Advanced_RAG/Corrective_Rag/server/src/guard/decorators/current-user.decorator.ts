import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SafeUser } from '../../types/auth.types';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

export function getCurrentUserFromContext(
  context: ExecutionContext,
): SafeUser | undefined {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

  return request.user;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SafeUser | undefined => {
    return getCurrentUserFromContext(context);
  },
);
