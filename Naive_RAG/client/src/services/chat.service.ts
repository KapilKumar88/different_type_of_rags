import { apiConfig } from "@/config/api.config";
import { apiClient } from "@/lib/api-client";
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
  DoneStreamEvent,
  ErrorStreamEvent,
  SourcesStreamEvent,
  TokenStreamEvent,
} from "@/types/chat.types";

function parseStreamEvent<TEvent>(event: MessageEvent): TEvent {
  return JSON.parse(event.data) as TEvent;
}

function emitStreamError(handlers: ChatStreamHandlers, message: string) {
  handlers.onError?.({ message });
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
        handlers.onError?.(parseStreamEvent<ErrorStreamEvent>(event as MessageEvent));
      } else {
        emitStreamError(handlers, "Unable to stream assistant response");
      }

      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  },
};
