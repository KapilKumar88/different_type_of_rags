import { envConfig } from "./env.config";

export const apiConfig = {
  baseUrl: envConfig.apiBaseUrl,
  endpoints: {
    auth: {
      register: "/api/v1/auth/register",
      login: "/api/v1/auth/login",
      me: "/api/v1/auth/me",
    },
    documents: {
      upload: "/api/v1/documents/upload",
      list: "/api/v1/documents",
      delete: (id: string) => `/api/v1/documents/${id}`,
    },
    chat: {
      ask: "/api/v1/chat/ask",
      conversations: "/api/v1/chat/conversations",
      conversation: (id: string) => `/api/v1/chat/conversations/${id}`,
      updateConversation: (id: string) => `/api/v1/chat/conversations/${id}`,
      updateConversationDocuments: (id: string) => `/api/v1/chat/conversations/${id}/documents`,
      deleteConversation: (id: string) => `/api/v1/chat/conversations/${id}`,
      messages: (conversationId: string) => `/api/v1/chat/conversations/${conversationId}/messages`,
      messageStream: (conversationId: string, messageId: string) =>
        `/api/v1/chat/conversations/${conversationId}/messages/${messageId}/stream`,
    },
  },
} as const;
