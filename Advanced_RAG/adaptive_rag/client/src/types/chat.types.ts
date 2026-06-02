export type SourceChunk = {
  chunkId: string;
  documentId: string;
  fileName: string;
  text: string;
  pageNumber?: number;
  score: number;
  createdAt: string;
};

export type AdaptiveRagRoute = "document" | "fallback";

export type AdaptiveRagFallbackReason =
  | "empty_document_scope"
  | "non_document_question"
  | "no_relevant_sources"
  | "empty_answer"
  | "ungrounded_answer"
  | "runtime_error";

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

export type ConversationMessageRole = "user" | "assistant";

export type ConversationMessage = {
  id: string;
  conversationId: string;
  role: ConversationMessageRole;
  content: string;
  sources: SourceChunk[] | null;
  adaptiveTrace: AdaptiveRagTrace | null;
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
  sources: SourceChunk[];
};

export type AdaptiveTraceStreamEvent = {
  adaptiveTrace: AdaptiveRagTrace;
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
  onAdaptiveTrace?: (event: AdaptiveTraceStreamEvent) => void;
  onToken?: (event: TokenStreamEvent) => void;
  onDone?: (event: DoneStreamEvent) => void;
  onError?: (event: ErrorStreamEvent) => void;
};
