import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Conversation } from "@/types/chat.types";
import type { RagDocument } from "@/types/document.types";

export function ConversationHeader({
  conversation,
  selectedDocuments,
  onEditScope,
}: Readonly<{
  conversation: Conversation | null;
  selectedDocuments: RagDocument[];
  onEditScope: () => void;
}>) {
  if (!conversation) {
    return null;
  }

  return (
    <div className="mb-6 border-b border-border pb-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 truncate text-lg font-semibold tracking-tight text-foreground">
          {conversation.title}
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEditScope}
          className="h-8 shrink-0 gap-1.5"
        >
          <FileText className="h-3.5 w-3.5" />
          Edit scope
        </Button>
      </div>
      <DocumentScope documents={selectedDocuments} />
    </div>
  );
}

export function DocumentScope({ documents }: Readonly<{ documents: RagDocument[] }>) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {documents.map((document) => (
        <Badge key={document.id} variant="outline" className="gap-1 font-normal">
          <FileText className="h-3 w-3" />
          {document.fileName}
        </Badge>
      ))}
    </div>
  );
}
