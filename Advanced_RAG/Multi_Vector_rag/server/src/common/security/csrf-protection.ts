import type { INestApplication } from '@nestjs/common';
import { doubleCsrf } from 'csrf-csrf';
import type { NextFunction, Request, Response } from 'express';
import { cookieConfig } from '../../config/cookie.config';
import { csrfConfig } from '../../config/csrf.config';

function getSessionIdentifier(request: Request): string {
  const authCookie = request.cookies?.[cookieConfig.name];

  if (typeof authCookie === 'string' && authCookie.length > 0) {
    return authCookie;
  }

  const userAgent = request.headers['user-agent'];
  const normalizedUserAgent = Array.isArray(userAgent)
    ? userAgent.join(',')
    : (userAgent ?? 'unknown-user-agent');

  return `${request.ip ?? 'unknown-ip'}:${normalizedUserAgent}`;
}

export const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => csrfConfig.secret,
  getSessionIdentifier,
  cookieName: csrfConfig.cookieName,
  cookieOptions: {
    httpOnly: true,
    secure: csrfConfig.secure,
    sameSite: csrfConfig.sameSite,
    path: '/',
    domain: csrfConfig.domain,
  },
  errorConfig: {
    statusCode: 403,
    message: 'Invalid CSRF token',
    code: 'EBADCSRFTOKEN',
  },
});

export function configureCsrfProtection(app: INestApplication): void {
  app.use((request: Request, response: Response, next: NextFunction) => {
    doubleCsrfProtection(request, response, (error?: unknown) => {
      if (error) {
        response.status(403).json({
          success: false,
          message: 'Invalid CSRF token',
          data: null,
        });
        return;
      }

      next();
    });
  });
}
