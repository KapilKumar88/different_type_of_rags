import * as React from "react";
import { Send, Sparkles, Plus, Copy, FileText, MessageSquarePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/chat/markdown";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ApiClientError } from "@/lib/api-client";
import { chatService } from "@/services/chat.service";
import type { SourceChunk } from "@/types/chat.types";
import { toast } from "sonner";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
};

const suggestedPrompts = [
  "Summarize the uploaded document in 5 bullets",
  "What are the main facts in this document?",
  "Which details answer my question?",
  "What information is missing from the document?",
];

export function ChatPage() {
  usePageMeta("Chat - RAG Assistant");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();

    if (!content || thinking) {
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
    };
    setMessages((current) => [...current, userMsg]);
    setInput("");
    setThinking(true);

    try {
      const response = await chatService.ask({ question: content });
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: response.data.answer,
        sources: response.data.sources,
      };
      setMessages((current) => [...current, assistantMsg]);
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Unable to ask question";
      toast.error("Question failed", { description: message });
    } finally {
      setThinking(false);
    }
  };

  const startNew = () => {
    setMessages([]);
    setInput("");
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 w-full">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-sidebar/40 lg:flex">
        <div className="border-b border-border p-3">
          <Button onClick={startNew} variant="outline" className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" /> New chat
          </Button>
        </div>
        <div className="p-4 text-sm text-muted-foreground">
          Ask questions against the chunks retrieved from Qdrant for this simple Naive RAG flow.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {isEmpty ? (
          <EmptyState onPrompt={(prompt) => send(prompt)} disabled={thinking} />
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
              <div className="space-y-6">
                {messages.map((message) => (
                  <MessageRow key={message.id} message={message} />
                ))}
                {thinking && <ThinkingRow />}
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-border bg-background/80 p-3 backdrop-blur sm:p-4">
          <div className="mx-auto w-full max-w-3xl">
            {!isEmpty && messages.length < 6 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {suggestedPrompts.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    disabled={thinking}
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
                placeholder="Ask anything about your uploaded documents..."
                className="min-h-[44px] resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0"
                rows={1}
              />
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  Ollama · top 5 chunks
                </div>
                <Button
                  size="sm"
                  onClick={() => send()}
                  disabled={!input.trim() || thinking}
                  className="gap-1.5"
                >
                  {thinking ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Send
                </Button>
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Responses are generated from retrieved source chunks only.
            </p>
          </div>
        </div>
      </div>
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
          ) : (
            <Markdown>{message.content}</Markdown>
          )}
        </div>
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceChunks sources={message.sources} />
        )}
        {!isUser && (
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

function ThinkingRow() {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-accent text-accent-foreground text-xs">
          <Sparkles className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3">
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
    </div>
  );
}

function EmptyState({
  onPrompt,
  disabled,
}: Readonly<{
  onPrompt: (prompt: string) => void;
  disabled: boolean;
}>) {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[var(--primary-glow)] text-primary-foreground shadow-[var(--shadow-elegant)]">
          <MessageSquarePlus className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Start a new conversation
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask a question after uploading and indexing documents.
        </p>
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
      </div>
    </div>
  );
}
