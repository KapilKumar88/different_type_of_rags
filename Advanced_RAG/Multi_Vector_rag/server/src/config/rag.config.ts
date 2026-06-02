import { env } from './env';

export const ragConfig = {
  topK: env.RAG_TOP_K,
  multiVectorQuestionsPerChunk: env.RAG_MULTI_VECTOR_QUESTIONS_PER_CHUNK,
  multiVectorGenerationBatchSize:
    env.RAG_MULTI_VECTOR_GENERATION_BATCH_SIZE,
  multiVectorSearchMultiplier: env.RAG_MULTI_VECTOR_SEARCH_MULTIPLIER,
  chunkSize: 800,
  chunkOverlap: 100,
  maxPromptContextCharacters: 6000,
  maxPromptHistoryCharacters: 3000,
  fallbackAnswer: 'I could not find this information in the uploaded document.',
} as const;
