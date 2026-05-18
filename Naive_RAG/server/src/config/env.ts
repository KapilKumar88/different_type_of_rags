import { z } from 'zod';

const defaultDatabaseUrl =
  'postgresql://postgres:password@localhost:5432/rag_naive_rag';
const defaultJwtSecret = 'development-only-auth-secret-change-me';

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    CLIENT_ORIGIN: z.url().default('http://localhost:5173'),
    DATABASE_URL: z.string().min(1).default(defaultDatabaseUrl),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    JWT_SECRET: z.string().min(32).default(defaultJwtSecret),
    JWT_EXPIRES_IN: z.string().min(1).default('7d'),
    AUTH_COOKIE_NAME: z.string().min(1).default('rag_auth_token'),
    AUTH_COOKIE_MAX_AGE_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(604800000),
    AUTH_COOKIE_SECURE: z.coerce.boolean().default(false),
    AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    AUTH_COOKIE_DOMAIN: z.string().optional(),
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV !== 'production') {
      return;
    }

    if (env.DATABASE_URL === defaultDatabaseUrl) {
      context.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'DATABASE_URL must be set in production',
      });
    }

    if (env.JWT_SECRET === defaultJwtSecret) {
      context.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be set in production',
      });
    }
  });

export const env = envSchema.parse(process.env);

export type AppEnvironment = typeof env;
