export type AdaptiveRagRoute = 'document' | 'fallback';

export type AdaptiveRagFallbackReason =
  | 'empty_document_scope'
  | 'non_document_question'
  | 'no_relevant_sources'
  | 'empty_answer'
  | 'ungrounded_answer'
  | 'runtime_error';

export type AdaptiveRagRetrievalAttempt = {
  attempt: number;
  query: string;
  rewritten: boolean;
  retrievedCount: number;
  relevantCount: number;
  maxScore: number | null;
  minScoreThreshold: number;
};

export type AdaptiveRagSourceGrade = {
  chunkId: string;
  documentId: string;
  relevant: boolean;
  score: number;
  reason?: string;
};

export type AdaptiveRagAnswerCheck = {
  grounded: boolean;
  useful: boolean;
  reason?: string;
};

export type AdaptiveRagTrace = {
  route: AdaptiveRagRoute;
  finalQuery: string;
  usedRewrite: boolean;
  retrievalAttempts: AdaptiveRagRetrievalAttempt[];
  sourceGrades: AdaptiveRagSourceGrade[];
  answerCheck: AdaptiveRagAnswerCheck | null;
  fallbackReason: AdaptiveRagFallbackReason | null;
  createdAt: string;
};

export type AdaptiveRagConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AdaptiveRagAnswerInput = {
  question: string;
  documentIds: string[];
  messages: AdaptiveRagConversationMessage[];
};

export type AdaptiveRagAnswerResult = {
  answer: string;
  sources: import('./rag.types').RetrievedChunk[];
  trace: AdaptiveRagTrace;
};
