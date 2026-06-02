import { env } from './env';

export const appConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  clientOrigin: env.CLIENT_ORIGIN,
} as const;
