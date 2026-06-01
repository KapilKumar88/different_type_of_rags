import { generatedTitleMaxLength } from "@/components/chat/chat.constants";
import type { ConversationMessage } from "@/types/chat.types";
import type { ChatMessage } from "@/types/chat-ui.types";
import type { RagDocument } from "@/types/document.types";

export function toChatMessage(message: ConversationMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    sources: message.sources ?? undefined,
    retrievalMetadata: message.retrievalMetadata ?? undefined,
  };
}

export function formatRelativeTime(value: string | undefined): string {
  if (!value) {
    return "Just now";
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Just now";
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (elapsedSeconds < 60) {
    return "Just now";
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  if (elapsedMinutes < 60) {
    return formatRelativeUnit(elapsedMinutes, "minute");
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return formatRelativeUnit(elapsedHours, "hour");
  }

  const elapsedDays = Math.floor(elapsedHours / 24);

  if (elapsedDays < 30) {
    return formatRelativeUnit(elapsedDays, "day");
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function getGeneratedConversationTitle(
  documents: RagDocument[],
  selectedCount: number,
): string {
  if (documents.length !== selectedCount || selectedCount === 0) {
    return formatDocumentCountTitle(selectedCount);
  }

  if (documents.length === 1) {
    return documents[0].fileName;
  }

  const compoundTitle = documents.map((document) => getFileBaseName(document.fileName)).join(" + ");

  return truncateGeneratedTitle(compoundTitle);
}

function formatRelativeUnit(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

function formatDocumentCountTitle(count: number): string {
  return count === 1 ? "1 document" : `${count} documents`;
}

function getFileBaseName(fileName: string): string {
  const trimmedFileName = fileName.trim();
  const extensionIndex = trimmedFileName.lastIndexOf(".");

  if (extensionIndex <= 0) {
    return trimmedFileName;
  }

  return trimmedFileName.slice(0, extensionIndex);
}

function truncateGeneratedTitle(title: string): string {
  if (title.length <= generatedTitleMaxLength) {
    return title;
  }

  return `${title.slice(0, generatedTitleMaxLength - 3).trimEnd()}...`;
}
