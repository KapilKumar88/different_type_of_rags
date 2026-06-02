import { env } from './env';

export const ragConfig = {
  topK: env.RAG_TOP_K,
  chunkSize: 800,
  chunkOverlap: 100,
  maxPromptContextCharacters: 6000,
  maxPromptHistoryCharacters: 3000,
  fallbackAnswer: 'I could not find this information in the uploaded document.',
  multiHop: {
    enabled: env.RAG_MULTI_HOP_ENABLED,
    maxHops: env.RAG_MULTI_HOP_MAX_HOPS,
    maxSubQuestions: env.RAG_MULTI_HOP_MAX_SUBQUESTIONS,
    perHopTopK: env.RAG_MULTI_HOP_PER_HOP_TOP_K,
    maxContextChunks: env.RAG_MULTI_HOP_MAX_CONTEXT_CHUNKS,
  },
} as const;
