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
  sourceType?: 'document';
  score: number;
};

export type WebSearchSource = {
  sourceType: 'web';
  sourceId: string;
  title: string;
  url: string;
  content: string;
  score: number;
  provider: 'tavily';
  createdAt: string;
};

export type RetrievedSource = RetrievedChunk | WebSearchSource;

export type RetrievalStrategy = 'multi_query' | 'self_rag' | 'corrective_rag';

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

export type CorrectiveRagRetrievalStatus =
  | 'correct'
  | 'ambiguous'
  | 'incorrect'
  | 'not_evaluated';

export type CorrectiveRagFinalDecision =
  | 'answered_with_local_context'
  | 'answered_with_corrected_context'
  | 'answered_with_web_context'
  | 'insufficient_context'
  | 'unsupported_answer'
  | 'evaluation_degraded';

export type CorrectiveRagAttemptType = 'initial_local' | 'corrective_local';

export type CorrectiveRagWebSearchStatus =
  | 'not_needed'
  | 'disabled'
  | 'searched'
  | 'no_results'
  | 'failed';

export type CorrectiveRagChunkEvaluation = SelfRagChunkEvaluation;

export type CorrectiveRagChunkRelevanceVerdict = SelfRagChunkRelevanceVerdict;

export type CorrectiveRagAnswerSupportVerdict = SelfRagAnswerSupportVerdict;

export type CorrectiveRagAnswerUtility = SelfRagAnswerUtility;

export type CorrectiveRagAnswerEvaluation = SelfRagAnswerEvaluation;

export type CorrectiveRagRetrievalAssessment = {
  status: CorrectiveRagRetrievalStatus;
  reason: string;
};

export type CorrectiveRagAttemptTrace = {
  attemptNumber: number;
  attemptType: CorrectiveRagAttemptType;
  seedQuery: string;
  generatedQueries: string[];
  retrievedChunkCount: number;
  acceptedChunkCount: number;
  rejectedChunkCount: number;
  correctiveQuery?: string;
  assessment: CorrectiveRagRetrievalAssessment;
  chunkEvaluations: CorrectiveRagChunkEvaluation[];
};

export type CorrectiveRagWebSearchTrace = {
  provider: 'tavily';
  status: CorrectiveRagWebSearchStatus;
  query?: string;
  resultCount: number;
  reason?: string;
};

export type CorrectiveRagRetrievalMetadata = {
  originalQuery: string;
  generatedQueries: string[];
  usedQueryCount: number;
  strategy: 'corrective_rag';
  createdAt: string;
  finalDecision: CorrectiveRagFinalDecision;
  attempts: CorrectiveRagAttemptTrace[];
  webSearch: CorrectiveRagWebSearchTrace;
  answerEvaluation: CorrectiveRagAnswerEvaluation;
};

export type RetrievalMetadata =
  | MultiQueryRetrievalMetadata
  | SelfRagRetrievalMetadata
  | CorrectiveRagRetrievalMetadata;
