import { apiConfig } from "@/config/api.config";
import { apiClient } from "@/lib/api-client";
import { clientLogger } from "@/lib/client-logger";
import type {
  AskQuestionPayload,
  AskQuestionResponse,
  ChatStreamHandlers,
  ConversationDetailsResponse,
  ConversationListResponse,
  CreateConversationPayload,
  CreateConversationResponse,
  CreateMessagePayload,
  CreateMessageResponse,
  DeleteConversationResponse,
  DoneStreamEvent,
  ErrorStreamEvent,
  SourcesStreamEvent,
  TokenStreamEvent,
  UpdateConversationDocumentsPayload,
  UpdateConversationDocumentsResponse,
  UpdateConversationPayload,
  UpdateConversationResponse,
} from "@/types/chat.types";

function parseStreamEvent<TEvent>(event: MessageEvent): TEvent {
  try {
    return JSON.parse(event.data) as TEvent;
  } catch (error) {
    clientLogger.error("chat.stream_parse_failed", error, {
      eventType: event.type,
    });
    throw error;
  }
}

function emitStreamError(handlers: ChatStreamHandlers, message: string, recoverable: boolean) {
  clientLogger.warn("chat.stream_error", { recoverable });
  handlers.onError?.({ message, recoverable });
}

export const chatService = {
  ask(payload: AskQuestionPayload): Promise<AskQuestionResponse> {
    return apiClient.post<AskQuestionResponse, AskQuestionPayload>(
      apiConfig.endpoints.chat.ask,
      payload,
    );
  },

  listConversations(): Promise<ConversationListResponse> {
    return apiClient.get<ConversationListResponse>(apiConfig.endpoints.chat.conversations);
  },

  createConversation(payload: CreateConversationPayload): Promise<CreateConversationResponse> {
    return apiClient.post<CreateConversationResponse, CreateConversationPayload>(
      apiConfig.endpoints.chat.conversations,
      payload,
    );
  },

  getConversation(id: string): Promise<ConversationDetailsResponse> {
    return apiClient.get<ConversationDetailsResponse>(apiConfig.endpoints.chat.conversation(id));
  },

  updateConversation(
    id: string,
    payload: UpdateConversationPayload,
  ): Promise<UpdateConversationResponse> {
    return apiClient.patch<UpdateConversationResponse, UpdateConversationPayload>(
      apiConfig.endpoints.chat.updateConversation(id),
      payload,
    );
  },

  updateConversationDocuments(
    id: string,
    payload: UpdateConversationDocumentsPayload,
  ): Promise<UpdateConversationDocumentsResponse> {
    return apiClient.patch<UpdateConversationDocumentsResponse, UpdateConversationDocumentsPayload>(
      apiConfig.endpoints.chat.updateConversationDocuments(id),
      payload,
    );
  },

  deleteConversation(id: string): Promise<DeleteConversationResponse> {
    return apiClient.delete<DeleteConversationResponse>(
      apiConfig.endpoints.chat.deleteConversation(id),
    );
  },

  createMessage(
    conversationId: string,
    payload: CreateMessagePayload,
  ): Promise<CreateMessageResponse> {
    return apiClient.post<CreateMessageResponse, CreateMessagePayload>(
      apiConfig.endpoints.chat.messages(conversationId),
      payload,
    );
  },

  streamMessage(
    conversationId: string,
    messageId: string,
    handlers: ChatStreamHandlers,
  ): () => void {
    const eventSource = new EventSource(
      `${apiConfig.baseUrl}${apiConfig.endpoints.chat.messageStream(conversationId, messageId)}`,
      { withCredentials: true },
    );

    eventSource.addEventListener("sources", (event) => {
      handlers.onSources?.(parseStreamEvent<SourcesStreamEvent>(event));
    });

    eventSource.addEventListener("token", (event) => {
      handlers.onToken?.(parseStreamEvent<TokenStreamEvent>(event));
    });

    eventSource.addEventListener("done", (event) => {
      handlers.onDone?.(parseStreamEvent<DoneStreamEvent>(event));
      eventSource.close();
    });

    eventSource.addEventListener("error", (event) => {
      if ("data" in event && typeof event.data === "string" && event.data) {
        handlers.onError?.({
          ...parseStreamEvent<ErrorStreamEvent>(event as MessageEvent),
          recoverable: false,
        });
      } else {
        emitStreamError(handlers, "Connection lost while streaming the response", true);
      }

      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  },
};
