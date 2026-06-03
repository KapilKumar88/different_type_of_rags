import type { GraphStreamEvent, SourceChunk } from "@/types/chat.types";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  sources?: SourceChunk[];
  graphContext?: GraphStreamEvent | null;
  pending?: boolean;
  failed?: boolean;
  retryMessageId?: string;
  retryConversationId?: string;
  retryAttempt?: number;
};
