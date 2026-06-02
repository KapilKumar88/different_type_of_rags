import type { Request } from 'express';
import type { SafeUser } from '../../types/auth.types';

export type AuthenticatedRequest = Request & {
  cookies?: Record<string, string | undefined>;
  user?: SafeUser;
};
