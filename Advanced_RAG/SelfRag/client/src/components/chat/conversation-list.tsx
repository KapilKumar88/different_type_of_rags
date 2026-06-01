import * as React from "react";
import {
  Check,
  FileText,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { conversationTitleMaxLength } from "@/components/chat/chat.constants";
import type { Conversation } from "@/types/chat.types";

export function ConversationList({
  conversations,
  activeConversationId,
  loading,
  onSelect,
  onRename,
  onDelete,
  renamingConversationId,
  deletingConversationId,
}: Readonly<{
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;
  onSelect: (conversationId: string) => void;
  onRename: (conversationId: string, title: string) => Promise<boolean>;
  onDelete: (conversationId: string) => Promise<boolean>;
  renamingConversationId: string | null;
  deletingConversationId: string | null;
}>) {
  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        <Loader2 className="mb-2 h-4 w-4 animate-spin" />
        Loading conversations...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Create a chat and choose the documents that should be available in that conversation.
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-2">
      <div className="space-y-1">
        {conversations.map((conversation) => {
          const active = conversation.id === activeConversationId;

          return (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              active={active}
              renaming={renamingConversationId === conversation.id}
              deleting={deletingConversationId === conversation.id}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
            />
          );
        })}
      </div>
    </div>
  );
}

function ConversationListItem({
  conversation,
  active,
  renaming,
  deleting,
  onSelect,
  onRename,
  onDelete,
}: Readonly<{
  conversation: Conversation;
  active: boolean;
  renaming: boolean;
  deleting: boolean;
  onSelect: (conversationId: string) => void;
  onRename: (conversationId: string, title: string) => Promise<boolean>;
  onDelete: (conversationId: string) => Promise<boolean>;
}>) {
  const [editing, setEditing] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState(conversation.title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!editing) {
      setDraftTitle(conversation.title);
    }
  }, [conversation.title, editing]);

  React.useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEditing = () => {
    setDraftTitle(conversation.title);
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraftTitle(conversation.title);
    setEditing(false);
  };

  const saveTitle = async () => {
    const nextTitle = draftTitle.trim();

    if (nextTitle === conversation.title) {
      setEditing(false);
      return;
    }

    const renamed = await onRename(conversation.id, nextTitle);

    if (renamed) {
      setEditing(false);
    }
  };

  const confirmDelete = async () => {
    const deleted = await onDelete(conversation.id);

    if (deleted) {
      setDeleteOpen(false);
    }
  };

  if (editing) {
    return (
      <div
        className={`rounded-lg px-2 py-2 transition-colors ${
          active ? "bg-accent text-accent-foreground" : "bg-card"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Input
            ref={inputRef}
            value={draftTitle}
            maxLength={conversationTitleMaxLength}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void saveTitle();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                cancelEditing();
              }
            }}
            disabled={renaming}
            className="h-8 min-w-0 text-sm"
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={saveTitle}
            disabled={renaming}
            aria-label="Save conversation title"
          >
            {renaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={cancelEditing}
            disabled={renaming}
            aria-label="Cancel rename"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="mt-1 flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
          <FileText className="h-3 w-3" />
          {conversation.documentIds.length} documents
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-start gap-1 rounded-lg px-2 py-2 transition-colors ${
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
      }`}
    >
      <button
        onClick={() => onSelect(conversation.id)}
        className="min-w-0 flex-1 text-left"
        type="button"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate text-sm font-medium">{conversation.title}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="h-3 w-3" />
          {conversation.documentIds.length} documents
        </div>
      </button>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0 text-muted-foreground"
              aria-label={`Open actions for ${conversation.title}`}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MoreHorizontal className="h-3.5 w-3.5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={startEditing}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault();
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes "{conversation.title}" and its saved messages. Documents
              remain available in your workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
