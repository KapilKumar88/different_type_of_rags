import { envConfig } from "./env.config";

function pathSegment(value: string): string {
  return encodeURIComponent(value);
}

export const apiConfig = {
  baseUrl: envConfig.apiBaseUrl,
  endpoints: {
    csrf: "/api/v1/csrf-token",
    auth: {
      register: "/api/v1/auth/register",
      login: "/api/v1/auth/login",
      me: "/api/v1/auth/me",
      logout: "/api/v1/auth/logout",
    },
    documents: {
      upload: "/api/v1/documents/upload",
      list: "/api/v1/documents",
      delete: (id: string) => `/api/v1/documents/${pathSegment(id)}`,
    },
    graph: {
      documentGraph: (id: string) => `/api/v1/graph/documents/${pathSegment(id)}`,
    },
    chat: {
      conversations: "/api/v1/chat/conversations",
      conversation: (id: string) => `/api/v1/chat/conversations/${pathSegment(id)}`,
      updateConversation: (id: string) => `/api/v1/chat/conversations/${pathSegment(id)}`,
      updateConversationDocuments: (id: string) =>
        `/api/v1/chat/conversations/${pathSegment(id)}/documents`,
      deleteConversation: (id: string) => `/api/v1/chat/conversations/${pathSegment(id)}`,
      messages: (conversationId: string) =>
        `/api/v1/chat/conversations/${pathSegment(conversationId)}/messages`,
      messageStream: (conversationId: string, messageId: string) =>
        `/api/v1/chat/conversations/${pathSegment(conversationId)}/messages/${pathSegment(
          messageId,
        )}/stream`,
    },
  },
} as const;
