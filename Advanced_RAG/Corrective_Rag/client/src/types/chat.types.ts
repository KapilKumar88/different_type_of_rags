export type SourceChunk = {
  sourceType?: "document";
  chunkId: string;
  documentId: string;
  fileName: string;
  text: string;
  pageNumber?: number;
  score: number;
  createdAt: string;
};

export type WebSource = {
  sourceType: "web";
  sourceId: string;
  title: string;
  url: string;
  content: string;
  score: number;
  provider: "tavily";
  createdAt: string;
};

export type MessageSource = SourceChunk | WebSource;

export type RetrievalStrategy = "multi_query" | "self_rag" | "corrective_rag";

export type MultiQueryRetrievalMetadata = {
  originalQuery: string;
  generatedQueries: string[];
  usedQueryCount: number;
  strategy: "multi_query";
  createdAt: string;
};

export type SelfRagFinalDecision =
  | "answered"
  | "insufficient_context"
  | "unsupported_answer"
  | "evaluation_degraded";

export type SelfRagChunkRelevanceVerdict =
  | "relevant"
  | "partially_relevant"
  | "irrelevant"
  | "not_evaluated";

export type SelfRagAnswerSupportVerdict =
  | "supported"
  | "partially_supported"
  | "unsupported"
  | "not_evaluated";

export type SelfRagAnswerUtility = "high" | "medium" | "low" | "not_evaluated";

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
  strategy: "self_rag";
  createdAt: string;
  finalDecision: SelfRagFinalDecision;
  attempts: SelfRagAttemptTrace[];
  answerEvaluation: SelfRagAnswerEvaluation;
};

export type CorrectiveRagRetrievalStatus = "correct" | "ambiguous" | "incorrect" | "not_evaluated";

export type CorrectiveRagFinalDecision =
  | "answered_with_local_context"
  | "answered_with_corrected_context"
  | "answered_with_web_context"
  | "insufficient_context"
  | "unsupported_answer"
  | "evaluation_degraded";

export type CorrectiveRagAttemptType = "initial_local" | "corrective_local";

export type CorrectiveRagWebSearchStatus =
  | "not_needed"
  | "disabled"
  | "searched"
  | "no_results"
  | "failed";

export type CorrectiveRagChunkEvaluation = SelfRagChunkEvaluation;

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
  provider: "tavily";
  status: CorrectiveRagWebSearchStatus;
  query?: string;
  resultCount: number;
  reason?: string;
};

export type CorrectiveRagRetrievalMetadata = {
  originalQuery: string;
  generatedQueries: string[];
  usedQueryCount: number;
  strategy: "corrective_rag";
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

export type ConversationMessageRole = "user" | "assistant";

export type ConversationMessage = {
  id: string;
  conversationId: string;
  role: ConversationMessageRole;
  content: string;
  sources: MessageSource[] | null;
  retrievalMetadata: RetrievalMetadata | null;
  createdAt: string;
  updatedAt: string;
};

export type Conversation = {
  id: string;
  userId: string;
  title: string;
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type ConversationDetails = Conversation & {
  messages: ConversationMessage[];
};

export type CreateConversationPayload = {
  title?: string;
  documentIds: string[];
};

export type UpdateConversationPayload = {
  title: string;
};

export type UpdateConversationDocumentsPayload = {
  documentIds: string[];
};

export type CreateMessagePayload = {
  content: string;
};

export type ConversationListResponse = {
  success: true;
  message: string;
  data: {
    conversations: Conversation[];
  };
};

export type CreateConversationResponse = {
  success: true;
  message: string;
  data: {
    conversation: Conversation;
  };
};

export type UpdateConversationResponse = {
  success: true;
  message: string;
  data: {
    conversation: Conversation;
  };
};

export type UpdateConversationDocumentsResponse = {
  success: true;
  message: string;
  data: {
    conversation: Conversation;
  };
};

export type DeleteConversationResponse = {
  success: true;
  message: string;
  data: {
    conversation: Conversation;
  };
};

export type ConversationDetailsResponse = {
  success: true;
  message: string;
  data: {
    conversation: ConversationDetails;
  };
};

export type CreateMessageResponse = {
  success: true;
  message: string;
  data: {
    message: ConversationMessage;
  };
};

export type SourcesStreamEvent = {
  sources: MessageSource[];
  retrievalMetadata: RetrievalMetadata;
};

export type TokenStreamEvent = {
  token: string;
};

export type DoneStreamEvent = {
  message: ConversationMessage;
};

export type ErrorStreamEvent = {
  message: string;
  recoverable?: boolean;
};

export type ChatStreamHandlers = {
  onSources?: (event: SourcesStreamEvent) => void;
  onToken?: (event: TokenStreamEvent) => void;
  onDone?: (event: DoneStreamEvent) => void;
  onError?: (event: ErrorStreamEvent) => void;
};
