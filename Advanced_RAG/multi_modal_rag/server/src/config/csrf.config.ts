import { env } from './env';

export const csrfConfig = {
  cookieName: env.CSRF_COOKIE_NAME,
  secret: env.CSRF_SECRET,
  secure: env.AUTH_COOKIE_SECURE,
  sameSite: env.AUTH_COOKIE_SAME_SITE,
  domain: env.AUTH_COOKIE_DOMAIN,
} as const;
