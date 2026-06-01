export type SourceChunk = {
  chunkId: string;
  documentId: string;
  fileName: string;
  text: string;
  pageNumber?: number;
  score: number;
  createdAt: string;
};

export type RetrievalStrategy = "multi_query";

export type RetrievalMetadata = {
  originalQuery: string;
  generatedQueries: string[];
  usedQueryCount: number;
  strategy: RetrievalStrategy;
  createdAt: string;
};

export type ConversationMessageRole = "user" | "assistant";

export type ConversationMessage = {
  id: string;
  conversationId: string;
  role: ConversationMessageRole;
  content: string;
  sources: SourceChunk[] | null;
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
  sources: SourceChunk[];
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
