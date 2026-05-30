import { env } from './env';

export const authRateLimitConfig = {
  ttlMs: env.AUTH_RATE_LIMIT_TTL_MS,
  limit: env.AUTH_RATE_LIMIT_LIMIT,
} as const;
