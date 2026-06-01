import { env } from './env';

export const appConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  requestTimeoutMs: env.SERVER_REQUEST_TIMEOUT_MS,
  clientOrigin: env.CLIENT_ORIGIN,
} as const;
