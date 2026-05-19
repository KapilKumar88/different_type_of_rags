import * as React from "react";
import {
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  sources?: SourceChunk[];
  pending?: boolean;
};

const conversationsQueryKey = ["chat", "conversations"] as const;
const documentsQueryKey = ["documents"] as const;
const generatedTitleMaxLength = 40;

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
  const streamCleanupRef = React.useRef<(() => void) | null>(null);
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
    setStreaming(false);
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
        sources: [],
        pending: true,
      };

      setMessages((current) => [...current, userMessage, pendingAssistant]);

      streamCleanupRef.current = chatService.streamMessage(
        activeConversationId,
        response.data.message.id,
        {
          onSources: ({ sources }) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === pendingId ? { ...message, sources } : message,
              ),
            );
          },
          onToken: ({ token }) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === pendingId
                  ? { ...message, content: `${message.content}${token}` }
                  : message,
              ),
            );
          },
          onDone: ({ message }) => {
            setMessages((current) =>
              current.map((currentMessage) =>
                currentMessage.id === pendingId ? toChatMessage(message) : currentMessage,
              ),
            );
            setStreaming(false);
            streamCleanupRef.current = null;
            queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
            queryClient.invalidateQueries({
              queryKey: ["chat", "conversation", activeConversationId],
            });
          },
          onError: ({ message }) => {
            toast.error("Response failed", { description: message });
            setMessages((current) => current.filter((item) => item.id !== pendingId));
            setStreaming(false);
            streamCleanupRef.current = null;
          },
        },
      );
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Unable to send message";
      toast.error("Message failed", { description: message });
      setStreaming(false);
    }
  };

  const loadingConversation = conversationQuery.isPending && Boolean(activeConversationId);
  const isEmpty = messages.length === 0;
  const sendDisabled = !input.trim() || streaming || !activeConversationId;

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
              />
              <div className="space-y-6">
                {messages.map((message) => (
                  <MessageRow key={message.id} message={message} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-border bg-background/80 p-3 backdrop-blur sm:p-4">
          <div className="mx-auto w-full">
            {activeConversation && selectedDocuments.length > 0 && (
              <DocumentScope documents={selectedDocuments} />
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
                  onClick={() => send()}
                  disabled={sendDisabled}
                  className="gap-1.5"
                >
                  {streaming ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Send
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
    </div>
  );
}

function toChatMessage(message: ConversationMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    sources: message.sources ?? undefined,
  };
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
}: Readonly<{
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;
  onSelect: (conversationId: string) => void;
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
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
              }`}
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
          );
        })}
      </div>
    </div>
  );
}

function ConversationHeader({
  conversation,
  selectedDocuments,
}: Readonly<{
  conversation: Conversation | null;
  selectedDocuments: RagDocument[];
}>) {
  if (!conversation) {
    return null;
  }

  return (
    <div className="mb-6 border-b border-border pb-4">
      <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
        {conversation.title}
      </h2>
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

function MessageRow({ message }: Readonly<{ message: ChatMessage }>) {
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
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
        Loading conversation...
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
