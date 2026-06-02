import { env } from './env';

export const ragConfig = {
  topK: env.RAG_TOP_K,
  hybridCandidateLimit: env.RAG_HYBRID_CANDIDATE_LIMIT,
  hybridRrfK: env.RAG_HYBRID_RRF_K,
  hybridDenseWeight: env.RAG_HYBRID_DENSE_WEIGHT,
  hybridSparseWeight: env.RAG_HYBRID_SPARSE_WEIGHT,
  sparseMaxFeatures: env.RAG_SPARSE_MAX_FEATURES,
  chunkSize: 800,
  chunkOverlap: 100,
  maxPromptContextCharacters: 6000,
  maxPromptHistoryCharacters: 3000,
  fallbackAnswer: 'I could not find this information in the uploaded document.',
} as const;
