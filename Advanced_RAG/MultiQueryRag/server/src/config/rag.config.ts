import { env } from './env';

export const ragConfig = {
  topK: env.RAG_TOP_K,
  multiQueryCount: env.RAG_MULTI_QUERY_COUNT,
  chunkSize: 800,
  chunkOverlap: 100,
  maxPromptContextCharacters: 12000,
  maxPromptHistoryCharacters: 3000,
  fallbackAnswer: 'I could not find this information in the uploaded document.',
} as const;
