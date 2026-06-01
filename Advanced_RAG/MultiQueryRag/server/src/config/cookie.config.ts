import { env } from './env';

export const cookieConfig = {
  name: env.AUTH_COOKIE_NAME,
  maxAgeMs: env.AUTH_COOKIE_MAX_AGE_MS,
  secure: env.AUTH_COOKIE_SECURE,
  sameSite: env.AUTH_COOKIE_SAME_SITE,
  domain: env.AUTH_COOKIE_DOMAIN,
} as const;
