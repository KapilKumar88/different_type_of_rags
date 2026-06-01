import { env } from './env';

export const ragRateLimitConfig = {
  upload: {
    name: 'ragUpload',
    ttlMs: env.RAG_UPLOAD_RATE_LIMIT_TTL_MS,
    limit: env.RAG_UPLOAD_RATE_LIMIT_LIMIT,
  },
  chat: {
    name: 'ragChat',
    ttlMs: env.RAG_CHAT_RATE_LIMIT_TTL_MS,
    limit: env.RAG_CHAT_RATE_LIMIT_LIMIT,
  },
  stream: {
    name: 'ragStream',
    ttlMs: env.RAG_STREAM_RATE_LIMIT_TTL_MS,
    limit: env.RAG_STREAM_RATE_LIMIT_LIMIT,
  },
  runtime: {
    concurrencyLimit: env.RAG_RUNTIME_CONCURRENCY_LIMIT,
  },
} as const;
