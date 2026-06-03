import type { ChatSource } from "@/types/chat.types";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  sources?: ChatSource[];
  pending?: boolean;
  failed?: boolean;
  retryMessageId?: string;
  retryConversationId?: string;
  retryAttempt?: number;
};
