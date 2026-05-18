import { env } from './env';

export const ragConfig = {
  topK: env.RAG_TOP_K,
  chunkSize: 800,
  chunkOverlap: 100,
  fallbackAnswer: 'I could not find this information in the uploaded document.',
} as const;
