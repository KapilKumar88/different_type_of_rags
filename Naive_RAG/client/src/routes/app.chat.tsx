import * as React from "react";
import { FileText, Plus, Send, Sparkles, Square } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { conversationTitleMaxLength, suggestedPrompts } from "@/components/chat/chat.constants";
import { getGeneratedConversationTitle, toChatMessage } from "@/components/chat/chat.helpers";
import { ConversationHeader, DocumentScope } from "@/components/chat/conversation-header";
import { ConversationList } from "@/components/chat/conversation-list";
import { EditScopeDialog, NewConversationDialog } from "@/components/chat/conversation-dialogs";
import { EmptyState, LoadingConversation, MessageRow } from "@/components/chat/message-display";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ApiClientError } from "@/lib/api-client";
import { chatService } from "@/services/chat.service";
import { documentsService } from "@/services/documents.service";
import type { ChatMessage } from "@/types/chat-ui.types";
import type { RagDocument } from "@/types/document.types";
import { toast } from "sonner";

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
const emptyConversations: NonNullable<
  Awaited<ReturnType<typeof chatService.listConversations>>["data"]["conversations"]
> = [];
const emptyDocuments: NonNullable<
  Awaited<ReturnType<typeof documentsService.list>>["data"]["documents"]
> = [];

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
  const tokenBufferRef = React.useRef("");
  const tokenFlushFrameRef = React.useRef<number | null>(null);
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

  const conversations = conversationsQuery.data?.data.conversations ?? emptyConversations;
  const documents = documentsQuery.data?.data.documents ?? emptyDocuments;
  const documentMap = React.useMemo(() => {
    return new Map(documents.map((document) => [document.id, document]));
  }, [documents]);
  const activeConversation = conversationQuery.data?.data.conversation ?? null;
  const selectedDocuments = React.useMemo(() => {
    return (
      activeConversation?.documentIds
        .map((id) => documentMap.get(id))
        .filter((document): document is RagDocument => Boolean(document)) ?? emptyDocuments
    );
  }, [activeConversation?.documentIds, documentMap]);

  const flushTokenBuffer = () => {
    const tokenBatch = tokenBufferRef.current;

    if (!tokenBatch) {
      tokenFlushFrameRef.current = null;
      return;
    }

    const pendingId = pendingAssistantIdRef.current;
    tokenBufferRef.current = "";
    tokenFlushFrameRef.current = null;

    if (!pendingId) {
      return;
    }

    setMessages((current) =>
      current.map((message) =>
        message.id === pendingId
          ? { ...message, content: `${message.content}${tokenBatch}` }
          : message,
      ),
    );
  };

  const clearTokenBuffer = () => {
    if (tokenFlushFrameRef.current !== null) {
      cancelAnimationFrame(tokenFlushFrameRef.current);
      tokenFlushFrameRef.current = null;
    }

    tokenBufferRef.current = "";
  };

  const queueToken = (token: string) => {
    tokenBufferRef.current += token;

    if (tokenFlushFrameRef.current !== null) {
      return;
    }

    tokenFlushFrameRef.current = requestAnimationFrame(flushTokenBuffer);
  };

  const takeBufferedTokens = () => {
    const tokenBatch = tokenBufferRef.current;
    clearTokenBuffer();

    return tokenBatch;
  };

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
      streamCleanupRef.current?.();

      if (tokenFlushFrameRef.current !== null) {
        cancelAnimationFrame(tokenFlushFrameRef.current);
      }
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
    clearTokenBuffer();
    streamCleanupRef.current = null;
    activeStreamIdRef.current = null;
    pendingAssistantIdRef.current = null;
    setStreaming(false);
  };

  const stopGenerating = () => {
    const pendingId = pendingAssistantIdRef.current;

    streamCleanupRef.current?.();
    clearTokenBuffer();
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

        queueToken(token);
      },
      onDone: ({ message }) => {
        if (activeStreamIdRef.current !== streamId) {
          return;
        }

        takeBufferedTokens();

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
        const tokenBatch = takeBufferedTokens();

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
              content: `${item.content}${tokenBatch}` || fallbackContent,
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
