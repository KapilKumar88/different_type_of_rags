import { env } from './env';

export const ragConfig = {
  topK: env.RAG_TOP_K,
  multiQueryCount: env.RAG_MULTI_QUERY_COUNT,
  selfRagMaxAttempts: env.RAG_SELF_RAG_MAX_ATTEMPTS,
  selfRagCandidateMultiplier: env.RAG_SELF_RAG_CANDIDATE_MULTIPLIER,
  chunkSize: 800,
  chunkOverlap: 100,
  maxPromptContextCharacters: 12000,
  maxPromptHistoryCharacters: 3000,
  fallbackAnswer: 'I could not find this information in the uploaded document.',
} as const;
