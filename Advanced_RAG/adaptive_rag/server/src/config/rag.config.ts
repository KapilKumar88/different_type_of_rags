import { env } from './env';

export const ragConfig = {
  topK: env.RAG_TOP_K,
  chunkSize: 800,
  chunkOverlap: 100,
  maxPromptContextCharacters: 6000,
  maxPromptHistoryCharacters: 3000,
  fallbackAnswer: 'I could not find this information in the uploaded document.',
  adaptive: {
    maxRetrievalAttempts: env.ADAPTIVE_RAG_MAX_RETRIEVAL_ATTEMPTS,
    minSourceScore: env.ADAPTIVE_RAG_MIN_SOURCE_SCORE,
    maxGradedSources: Math.min(
      env.ADAPTIVE_RAG_MAX_GRADED_SOURCES,
      env.RAG_TOP_K,
    ),
    maxAnswerAttempts: env.ADAPTIVE_RAG_MAX_ANSWER_ATTEMPTS,
  },
} as const;
