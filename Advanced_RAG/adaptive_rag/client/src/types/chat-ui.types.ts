import type { SourceChunk } from "@/types/chat.types";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  sources?: SourceChunk[];
  pending?: boolean;
  failed?: boolean;
  retryMessageId?: string;
  retryConversationId?: string;
  retryAttempt?: number;
};
