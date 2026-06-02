export type ChunkPayload = {
  chunkId: string;
  documentId: string;
  fileName: string;
  text: string;
  pageNumber?: number;
  createdAt: string;
};

export type VectorPoint = {
  id: string;
  vector: number[];
  payload: ChunkPayload;
};

export type RetrievedChunk = ChunkPayload & {
  score: number;
};

export type RetrievalStrategy = 'multi_query' | 'self_rag';

export type MultiQueryRetrievalMetadata = {
  originalQuery: string;
  generatedQueries: string[];
  usedQueryCount: number;
  strategy: 'multi_query';
  createdAt: string;
};

export type SelfRagFinalDecision =
  | 'answered'
  | 'insufficient_context'
  | 'unsupported_answer'
  | 'evaluation_degraded';

export type SelfRagChunkRelevanceVerdict =
  | 'relevant'
  | 'partially_relevant'
  | 'irrelevant'
  | 'not_evaluated';

export type SelfRagAnswerSupportVerdict =
  | 'supported'
  | 'partially_supported'
  | 'unsupported'
  | 'not_evaluated';

export type SelfRagAnswerUtility = 'high' | 'medium' | 'low' | 'not_evaluated';

export type SelfRagChunkEvaluation = {
  chunkId: string;
  fileName: string;
  pageNumber?: number;
  score: number;
  verdict: SelfRagChunkRelevanceVerdict;
  reason: string;
};

export type SelfRagAnswerEvaluation = {
  verdict: SelfRagAnswerSupportVerdict;
  utility: SelfRagAnswerUtility;
  reason: string;
};

export type SelfRagAttemptTrace = {
  attemptNumber: number;
  seedQuery: string;
  generatedQueries: string[];
  retrievedChunkCount: number;
  acceptedChunkCount: number;
  rejectedChunkCount: number;
  refinementQuery?: string;
  chunkEvaluations: SelfRagChunkEvaluation[];
};

export type SelfRagRetrievalMetadata = {
  originalQuery: string;
  generatedQueries: string[];
  usedQueryCount: number;
  strategy: 'self_rag';
  createdAt: string;
  finalDecision: SelfRagFinalDecision;
  attempts: SelfRagAttemptTrace[];
  answerEvaluation: SelfRagAnswerEvaluation;
};

export type RetrievalMetadata =
  | MultiQueryRetrievalMetadata
  | SelfRagRetrievalMetadata;
