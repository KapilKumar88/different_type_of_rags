import * as React from "react";
import {
  CheckCircle2,
  Check,
  Copy,
  FileText,
  Loader2,
  MoreHorizontal,
  MessageSquare,
  MessageSquarePlus,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Markdown } from "@/components/chat/markdown";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ApiClientError } from "@/lib/api-client";
import { chatService } from "@/services/chat.service";
import { documentsService } from "@/services/documents.service";
import type { Conversation, ConversationMessage, SourceChunk } from "@/types/chat.types";
import type { RagDocument } from "@/types/document.types";
import { toast } from "sonner";

type ChatMessage = {
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

type RenameConversationInput = {
  conversationId: string;
  title: string;
};

type UpdateConversationDocumentsInput = {
  conversationId: string;
  documentIds: string[];
};

const conversationsQueryKey = ["chat", "conversations"] as const;
const documentsQueryKey = ["documents"] as const;
const generatedTitleMaxLength = 40;
const conversationTitleMaxLength = 180;

const suggestedPrompts = [
  "Summarize the selected documents in 5 bullets",
  "What are the main facts in this conversation?",
  "Which details answer my question?",
  "What information is missing from the documents?",
];

export function ChatPage() {
  usePageMeta("Chat - RAG Assistant");
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = React.useState<string[]>([]);
  const [scopeDialogOpen, setScopeDialogOpen] = React.useState(false);
  const [scopeDocumentIds, setScopeDocumentIds] = React.useState<string[]>([]);
  const streamCleanupRef = React.useRef<(() => void) | null>(null);
  const activeStreamIdRef = React.useRef<number | null>(null);
  const streamSequenceRef = React.useRef(0);
  const pendingAssistantIdRef = React.useRef<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const conversationsQuery = useQuery({
    queryKey: conversationsQueryKey,
    queryFn: chatService.listConversations,
  });
  const documentsQuery = useQuery({
    queryKey: documentsQueryKey,
    queryFn: documentsService.list,
  });
  const conversationQuery = useQuery({
    queryKey: ["chat", "conversation", activeConversationId],
    queryFn: () => chatService.getConversation(activeConversationId ?? ""),
    enabled: Boolean(activeConversationId),
  });

  const conversations = conversationsQuery.data?.data.conversations ?? [];
  const documents = documentsQuery.data?.data.documents ?? [];
  const documentMap = React.useMemo(() => {
    return new Map(documents.map((document) => [document.id, document]));
  }, [documents]);
  const activeConversation = conversationQuery.data?.data.conversation ?? null;
  const selectedDocuments =
    activeConversation?.documentIds
      .map((id) => documentMap.get(id))
      .filter((document): document is RagDocument => Boolean(document)) ?? [];

  React.useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations]);

  React.useEffect(() => {
    if (!activeConversation || streaming) {
      return;
    }

    setMessages(activeConversation.messages.map(toChatMessage));
  }, [activeConversation, streaming]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  React.useEffect(() => {
    return () => {
      closeStream();
    };
  }, []);

  const updateConversationMutation = useMutation({
    mutationFn: ({ conversationId, title }: RenameConversationInput) =>
      chatService.updateConversation(conversationId, { title }),
  });

  const updateConversationDocumentsMutation = useMutation({
    mutationFn: ({ conversationId, documentIds }: UpdateConversationDocumentsInput) =>
      chatService.updateConversationDocuments(conversationId, { documentIds }),
  });
  const deleteConversationMutation = useMutation({
    mutationFn: chatService.deleteConversation,
  });

  const createConversationMutation = useMutation({
    mutationFn: () => {
      const selectedDocumentsForTitle = selectedDocumentIds
        .map((id) => documentMap.get(id))
        .filter((document): document is RagDocument => Boolean(document));
      const title = getGeneratedConversationTitle(
        selectedDocumentsForTitle,
        selectedDocumentIds.length,
      );

      return chatService.createConversation({
        title,
        documentIds: selectedDocumentIds,
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
      setActiveConversationId(response.data.conversation.id);
      setMessages([]);
      setInput("");
      setSelectedDocumentIds([]);
      setDialogOpen(false);
    },
    onError: (error) => {
      const message = error instanceof ApiClientError ? error.message : "Unable to create chat";
      toast.error("Conversation failed", { description: message });
    },
  });

  const closeStream = () => {
    streamCleanupRef.current?.();
    streamCleanupRef.current = null;
    activeStreamIdRef.current = null;
    pendingAssistantIdRef.current = null;
    setStreaming(false);
  };

  const stopGenerating = () => {
    const pendingId = pendingAssistantIdRef.current;

    streamCleanupRef.current?.();
    streamCleanupRef.current = null;
    activeStreamIdRef.current = null;
    pendingAssistantIdRef.current = null;
    setStreaming(false);

    if (!pendingId) {
      return;
    }

    setMessages((current) =>
      current.map((message) => {
        if (message.id !== pendingId) {
          return message;
        }

        const stoppedContent = message.content ? `${message.content}\n\n[stopped]` : "[stopped]";

        return {
          ...message,
          content: stoppedContent,
          pending: false,
        };
      }),
    );
  };

  const startNew = () => {
    closeStream();
    setSelectedDocumentIds([]);
    setDialogOpen(true);
  };

  const selectConversation = (conversationId: string) => {
    if (conversationId === activeConversationId) {
      return;
    }

    closeStream();
    setActiveConversationId(conversationId);
    setInput("");
    setMessages([]);
  };

  const toggleDocument = (documentId: string) => {
    setSelectedDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    );
  };

  const toggleScopeDocument = (documentId: string) => {
    setScopeDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    );
  };

  const openScopeDialog = () => {
    if (!activeConversation) {
      return;
    }

    setScopeDocumentIds(activeConversation.documentIds);
    setScopeDialogOpen(true);
  };

  const saveScope = async () => {
    if (!activeConversationId || scopeDocumentIds.length === 0) {
      return;
    }

    try {
      const response = await updateConversationDocumentsMutation.mutateAsync({
        conversationId: activeConversationId,
        documentIds: scopeDocumentIds,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: conversationsQueryKey }),
        queryClient.invalidateQueries({
          queryKey: ["chat", "conversation", activeConversationId],
        }),
      ]);
      setScopeDocumentIds(response.data.conversation.documentIds);
      setScopeDialogOpen(false);
      toast.success("Document scope updated", {
        description: `${response.data.conversation.documentIds.length} documents selected`,
      });
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to update document scope";
      toast.error("Scope update failed", { description: message });
    }
  };

  const deleteConversation = async (conversationId: string): Promise<boolean> => {
    const conversation = conversations.find((item) => item.id === conversationId);

    try {
      const response = await deleteConversationMutation.mutateAsync(conversationId);
      const remainingConversations = conversations.filter((item) => item.id !== conversationId);

      queryClient.removeQueries({
        queryKey: ["chat", "conversation", conversationId],
      });
      await queryClient.invalidateQueries({ queryKey: conversationsQueryKey });

      if (activeConversationId === conversationId) {
        closeStream();
        setActiveConversationId(remainingConversations[0]?.id ?? null);
        setMessages([]);
        setInput("");
      }

      toast.success("Conversation deleted", {
        description: response.data.conversation.title,
      });

      return true;
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to delete conversation";
      toast.error("Delete failed", {
        description: conversation?.title ? `${conversation.title}: ${message}` : message,
      });

      return false;
    }
  };

  const renameConversation = async (conversationId: string, title: string): Promise<boolean> => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      toast.error("Rename failed", { description: "Conversation title is required" });
      return false;
    }

    if (trimmedTitle.length > conversationTitleMaxLength) {
      toast.error("Rename failed", {
        description: `Conversation title must be ${conversationTitleMaxLength} characters or fewer`,
      });
      return false;
    }

    try {
      const response = await updateConversationMutation.mutateAsync({
        conversationId,
        title: trimmedTitle,
      });

      queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
      queryClient.invalidateQueries({
        queryKey: ["chat", "conversation", conversationId],
      });
      toast.success("Conversation renamed", {
        description: response.data.conversation.title,
      });

      return true;
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to rename conversation";
      toast.error("Rename failed", { description: message });

      return false;
    }
  };

  const streamAssistantResponse = ({
    conversationId,
    userMessageId,
    pendingId,
    retryAttempt,
  }: {
    conversationId: string;
    userMessageId: string;
    pendingId: string;
    retryAttempt: number;
  }) => {
    const streamId = streamSequenceRef.current + 1;
    streamSequenceRef.current = streamId;
    activeStreamIdRef.current = streamId;
    pendingAssistantIdRef.current = pendingId;
    setStreaming(true);

    streamCleanupRef.current = chatService.streamMessage(conversationId, userMessageId, {
      onSources: ({ sources }) => {
        if (activeStreamIdRef.current !== streamId) {
          return;
        }

        setMessages((current) =>
          current.map((message) => (message.id === pendingId ? { ...message, sources } : message)),
        );
      },
      onToken: ({ token }) => {
        if (activeStreamIdRef.current !== streamId) {
          return;
        }

        setMessages((current) =>
          current.map((message) =>
            message.id === pendingId
              ? { ...message, content: `${message.content}${token}` }
              : message,
          ),
        );
      },
      onDone: ({ message }) => {
        if (activeStreamIdRef.current !== streamId) {
          return;
        }

        setMessages((current) =>
          current.map((currentMessage) =>
            currentMessage.id === pendingId ? toChatMessage(message) : currentMessage,
          ),
        );
        setStreaming(false);
        streamCleanupRef.current = null;
        activeStreamIdRef.current = null;
        pendingAssistantIdRef.current = null;
        queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
        queryClient.invalidateQueries({
          queryKey: ["chat", "conversation", conversationId],
        });
      },
      onError: ({ message, recoverable }) => {
        if (activeStreamIdRef.current !== streamId) {
          return;
        }

        const canRetry = Boolean(recoverable) && retryAttempt < 3;

        setMessages((current) =>
          current.map((item) => {
            if (item.id !== pendingId) {
              return item;
            }

            const fallbackContent = canRetry
              ? "Connection lost while streaming. You can retry this response."
              : message;

            return {
              ...item,
              content: item.content || fallbackContent,
              pending: false,
              failed: canRetry,
              retryConversationId: canRetry ? conversationId : undefined,
              retryMessageId: canRetry ? userMessageId : undefined,
              retryAttempt,
            };
          }),
        );
        toast.error(canRetry ? "Connection lost" : "Response failed", { description: message });
        setStreaming(false);
        streamCleanupRef.current = null;
        activeStreamIdRef.current = null;
        pendingAssistantIdRef.current = null;
      },
    });
  };

  const retryStream = (message: ChatMessage) => {
    if (streaming || !message.retryConversationId || !message.retryMessageId || !message.failed) {
      return;
    }

    const retryAttempt = (message.retryAttempt ?? 0) + 1;

    setMessages((current) =>
      current.map((item) =>
        item.id === message.id
          ? {
              ...item,
              content: "",
              sources: [],
              pending: true,
              failed: false,
              retryAttempt,
            }
          : item,
      ),
    );
    streamAssistantResponse({
      conversationId: message.retryConversationId,
      userMessageId: message.retryMessageId,
      pendingId: message.id,
      retryAttempt,
    });
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();

    if (!content || streaming || !activeConversationId) {
      return;
    }

    setInput("");
    setStreaming(true);

    try {
      const response = await chatService.createMessage(activeConversationId, { content });
      const userMessage = toChatMessage(response.data.message);
      const pendingId = `pending-${response.data.message.id}`;
      const pendingAssistant: ChatMessage = {
        id: pendingId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        sources: [],
        pending: true,
        retryConversationId: activeConversationId,
        retryMessageId: response.data.message.id,
        retryAttempt: 0,
      };

      setMessages((current) => [...current, userMessage, pendingAssistant]);
      streamAssistantResponse({
        conversationId: activeConversationId,
        userMessageId: response.data.message.id,
        pendingId,
        retryAttempt: 0,
      });
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Unable to send message";
      toast.error("Message failed", { description: message });
      setStreaming(false);
    }
  };

  const loadingConversation = conversationQuery.isPending && Boolean(activeConversationId);
  const isEmpty = messages.length === 0;
  const sendDisabled = !input.trim() || streaming || !activeConversationId;
  const renamingConversationId = updateConversationMutation.isPending
    ? (updateConversationMutation.variables?.conversationId ?? null)
    : null;
  const deletingConversationId = deleteConversationMutation.isPending
    ? (deleteConversationMutation.variables ?? null)
    : null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 w-full">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-sidebar/40 lg:flex">
        <div className="border-b border-border p-3">
          <Button onClick={startNew} variant="outline" className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" /> New chat
          </Button>
        </div>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          loading={conversationsQuery.isPending}
          onSelect={selectConversation}
          onRename={renameConversation}
          onDelete={deleteConversation}
          renamingConversationId={renamingConversationId}
          deletingConversationId={deletingConversationId}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 lg:hidden">
          <Button onClick={startNew} variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New
          </Button>
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-medium text-foreground">
              {activeConversation?.title ?? "No conversation selected"}
            </p>
            <p className="text-xs text-muted-foreground">{selectedDocuments.length} documents</p>
          </div>
        </div>

        {loadingConversation ? (
          <LoadingConversation />
        ) : isEmpty ? (
          <EmptyState
            onPrompt={(prompt) => send(prompt)}
            disabled={streaming || !activeConversationId}
            hasConversation={Boolean(activeConversationId)}
            onStartNew={startNew}
          />
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full px-4 py-6 sm:py-8">
              <ConversationHeader
                conversation={activeConversation}
                selectedDocuments={selectedDocuments}
                onEditScope={openScopeDialog}
              />
              <div className="space-y-6">
                {messages.map((message) => (
                  <MessageRow key={message.id} message={message} onRetry={retryStream} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-border bg-background/80 p-3 backdrop-blur sm:p-4">
          <div className="mx-auto w-full">
            {activeConversation && selectedDocuments.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <DocumentScope documents={selectedDocuments} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={openScopeDialog}
                  className="h-7 gap-1.5 px-2 text-xs"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Edit scope
                </Button>
              </div>
            )}
            {!isEmpty && messages.length < 6 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {suggestedPrompts.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    disabled={streaming || !activeConversationId}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            <div className="rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                placeholder={
                  activeConversationId
                    ? "Ask about the selected documents..."
                    : "Create a document-scoped chat first..."
                }
                disabled={streaming || !activeConversationId}
                className="min-h-[44px] resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0 disabled:opacity-70"
                rows={1}
              />
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  {activeConversationId ? "Scoped RAG · top 5 chunks" : "Select documents to chat"}
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (streaming) {
                      stopGenerating();
                      return;
                    }

                    void send();
                  }}
                  disabled={streaming ? false : sendDisabled}
                  className="gap-1.5"
                >
                  {streaming ? (
                    <Square className="h-3.5 w-3.5 fill-current" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {streaming ? "Stop" : "Send"}
                </Button>
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Responses are generated only from documents selected for this conversation.
            </p>
          </div>
        </div>
      </div>

      <NewConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        documents={documents}
        loading={documentsQuery.isPending}
        selectedDocumentIds={selectedDocumentIds}
        creating={createConversationMutation.isPending}
        onToggleDocument={toggleDocument}
        onCreate={() => createConversationMutation.mutate()}
      />
      <EditScopeDialog
        open={scopeDialogOpen}
        onOpenChange={setScopeDialogOpen}
        documents={documents}
        loading={documentsQuery.isPending}
        selectedDocumentIds={scopeDocumentIds}
        saving={updateConversationDocumentsMutation.isPending}
        hasMessages={messages.length > 0}
        onToggleDocument={toggleScopeDocument}
        onSave={() => {
          void saveScope();
        }}
      />
    </div>
  );
}

function toChatMessage(message: ConversationMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    sources: message.sources ?? undefined,
  };
}

function formatRelativeTime(value: string | undefined): string {
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

function formatRelativeUnit(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

function getGeneratedConversationTitle(documents: RagDocument[], selectedCount: number): string {
  if (documents.length !== selectedCount || selectedCount === 0) {
    return formatDocumentCountTitle(selectedCount);
  }

  if (documents.length === 1) {
    return documents[0].fileName;
  }

  const compoundTitle = documents.map((document) => getFileBaseName(document.fileName)).join(" + ");

  return truncateGeneratedTitle(compoundTitle);
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

function ConversationList({
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

function ConversationHeader({
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

function DocumentScope({ documents }: Readonly<{ documents: RagDocument[] }>) {
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

function MessageRow({
  message,
  onRetry,
}: Readonly<{
  message: ChatMessage;
  onRetry: (message: ChatMessage) => void;
}>) {
  const isUser = message.role === "user";

  return (
    <div className={`group flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={
            isUser
              ? "bg-primary text-primary-foreground text-xs"
              : "bg-accent text-accent-foreground text-xs"
          }
        >
          {isUser ? "AL" : <Sparkles className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={`flex max-w-[85%] flex-col space-y-2 ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-card-foreground"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : message.content ? (
            <Markdown>{message.content}</Markdown>
          ) : (
            <StreamingDots />
          )}
        </div>
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceChunks sources={message.sources} />
        )}
        <span className="px-1 text-[11px] text-muted-foreground">
          {formatRelativeTime(message.createdAt)}
        </span>
        {!isUser && message.failed && message.retryMessageId && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => onRetry(message)}
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        )}
        {!isUser && !message.pending && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              onClick={() => {
                navigator.clipboard.writeText(message.content);
                toast.success("Copied to clipboard");
              }}
            >
              <Copy className="h-3 w-3" /> Copy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceChunks({ sources }: Readonly<{ sources: SourceChunk[] }>) {
  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Retrieved chunks:</span>
        {sources.map((source) => (
          <Badge key={source.chunkId} variant="secondary" className="gap-1 font-normal">
            <FileText className="h-3 w-3" />
            {source.fileName}
            {source.pageNumber ? ` · p.${source.pageNumber}` : ""}
            {` · ${source.score.toFixed(3)}`}
          </Badge>
        ))}
      </div>
      <div className="space-y-2">
        {sources.map((source, index) => (
          <details key={source.chunkId} className="rounded-lg border border-border bg-muted/30 p-3">
            <summary className="cursor-pointer text-xs font-medium text-foreground">
              Source {index + 1}: {source.fileName}
              {source.pageNumber ? ` · page ${source.pageNumber}` : ""}
            </summary>
            <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
              {source.text}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

function StreamingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      <span
        className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted-foreground"
        style={{ animationDelay: "0s" }}
      />
      <span
        className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted-foreground"
        style={{ animationDelay: "0.15s" }}
      />
      <span
        className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted-foreground"
        style={{ animationDelay: "0.3s" }}
      />
    </div>
  );
}

function LoadingConversation() {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="mx-auto w-full px-4 py-6 sm:py-8">
        <div className="mb-6 border-b border-border pb-4">
          <div className="h-6 w-56 animate-pulse rounded bg-muted" />
          <div className="mt-3 flex gap-1.5">
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-32 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
        <div className="space-y-6">
          <MessageSkeleton align="left" widthClass="w-[72%]" />
          <MessageSkeleton align="right" widthClass="w-[48%]" />
          <MessageSkeleton align="left" widthClass="w-[64%]" />
          <MessageSkeleton align="right" widthClass="w-[58%]" />
        </div>
      </div>
    </div>
  );
}

function MessageSkeleton({
  align,
  widthClass,
}: Readonly<{
  align: "left" | "right";
  widthClass: string;
}>) {
  const isRightAligned = align === "right";

  return (
    <div className={`flex w-full gap-3 ${isRightAligned ? "flex-row-reverse" : ""}`}>
      <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
      <div
        className={`flex w-full max-w-[85%] flex-col gap-2 ${
          isRightAligned ? "items-end" : "items-start"
        }`}
      >
        <div className={`h-12 ${widthClass} min-w-40 animate-pulse rounded-2xl bg-muted`} />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function EmptyState({
  onPrompt,
  disabled,
  hasConversation,
  onStartNew,
}: Readonly<{
  onPrompt: (prompt: string) => void;
  disabled: boolean;
  hasConversation: boolean;
  onStartNew: () => void;
}>) {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[var(--primary-glow)] text-primary-foreground shadow-[var(--shadow-elegant)]">
          <MessageSquarePlus className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {hasConversation ? "Start the conversation" : "Create a document-scoped chat"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {hasConversation
            ? "Ask a question using only the documents selected for this chat."
            : "Choose one or more indexed documents before asking questions."}
        </p>
        {!hasConversation && (
          <Button onClick={onStartNew} className="mt-5 gap-1.5">
            <Plus className="h-4 w-4" /> New chat
          </Button>
        )}
        {hasConversation && (
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                disabled={disabled}
                onClick={() => onPrompt(prompt)}
                className="rounded-xl border border-border bg-card p-3 text-left text-sm text-foreground transition-all hover:border-primary/40 hover:bg-accent/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewConversationDialog({
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

        <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
          {loading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              Upload and index documents before creating a chat.
            </div>
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
                            Selected
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

function EditScopeDialog({
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

        <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
          {loading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              Upload and index documents before editing scope.
            </div>
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
                            In scope
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
