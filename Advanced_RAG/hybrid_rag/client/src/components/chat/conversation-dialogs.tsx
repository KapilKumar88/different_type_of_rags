import { Check, CheckCircle2, FileText, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RagDocument } from "@/types/document.types";

export function NewConversationDialog({
  open,
  onOpenChange,
  documents,
  loading,
  selectedDocumentIds,
  creating,
  onToggleDocument,
  onCreate,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: RagDocument[];
  loading: boolean;
  selectedDocumentIds: string[];
  creating: boolean;
  onToggleDocument: (documentId: string) => void;
  onCreate: () => void;
}>) {
  const canCreate = selectedDocumentIds.length > 0 && !creating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New chat</DialogTitle>
          <DialogDescription>
            Select the indexed documents available in this chat.
          </DialogDescription>
        </DialogHeader>

        <DocumentSelectionList
          documents={documents}
          loading={loading}
          selectedDocumentIds={selectedDocumentIds}
          emptyMessage="Upload and index documents before creating a chat."
          selectedLabel="Selected"
          onToggleDocument={onToggleDocument}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={!canCreate} className="gap-1.5">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditScopeDialog({
  open,
  onOpenChange,
  documents,
  loading,
  selectedDocumentIds,
  saving,
  hasMessages,
  onToggleDocument,
  onSave,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: RagDocument[];
  loading: boolean;
  selectedDocumentIds: string[];
  saving: boolean;
  hasMessages: boolean;
  onToggleDocument: (documentId: string) => void;
  onSave: () => void;
}>) {
  const canSave = selectedDocumentIds.length > 0 && !saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit document scope</DialogTitle>
          <DialogDescription>
            Add or remove indexed documents for this conversation.
          </DialogDescription>
        </DialogHeader>

        {hasMessages && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            Future answers will use the updated document scope. Existing messages stay in this
            conversation and may have been generated from the previous scope.
          </div>
        )}

        <DocumentSelectionList
          documents={documents}
          loading={loading}
          selectedDocumentIds={selectedDocumentIds}
          emptyMessage="Upload and index documents before editing scope."
          selectedLabel="In scope"
          onToggleDocument={onToggleDocument}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!canSave} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save scope
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocumentSelectionList({
  documents,
  loading,
  selectedDocumentIds,
  emptyMessage,
  selectedLabel,
  onToggleDocument,
}: Readonly<{
  documents: RagDocument[];
  loading: boolean;
  selectedDocumentIds: string[];
  emptyMessage: string;
  selectedLabel: string;
  onToggleDocument: (documentId: string) => void;
}>) {
  return (
    <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
      {loading ? (
        <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">{emptyMessage}</div>
      ) : (
        <div className="divide-y divide-border">
          {documents.map((document) => {
            const checked = selectedDocumentIds.includes(document.id);

            return (
              <label
                key={document.id}
                className="flex cursor-pointer items-start gap-3 p-3 hover:bg-accent/40"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => onToggleDocument(document.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium text-foreground">
                      {document.fileName}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{document.chunkCount} chunks</span>
                    {checked && (
                      <span className="inline-flex items-center gap-1 text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        {selectedLabel}
                      </span>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
