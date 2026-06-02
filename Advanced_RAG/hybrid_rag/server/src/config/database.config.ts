import { env } from './env';

export const databaseConfig = {
  url: env.DATABASE_URL,
  poolMax: env.DATABASE_POOL_MAX,
} as const;
