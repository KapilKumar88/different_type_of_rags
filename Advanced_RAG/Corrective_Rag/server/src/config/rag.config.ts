import { env } from './env';

export const ragConfig = {
  topK: env.RAG_TOP_K,
  multiQueryCount: env.RAG_MULTI_QUERY_COUNT,
  correctiveRagMaxAttempts: env.RAG_CORRECTIVE_RAG_MAX_ATTEMPTS,
  correctiveRagCandidateMultiplier:
    env.RAG_CORRECTIVE_RAG_CANDIDATE_MULTIPLIER,
  chunkSize: 800,
  chunkOverlap: 100,
  maxPromptContextCharacters: 12000,
  maxPromptHistoryCharacters: 3000,
  fallbackAnswer: 'I could not find this information in the uploaded document.',
} as const;
