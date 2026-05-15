import * as React from "react";
import { Send, Sparkles, Plus, Copy, RotateCcw, FileText, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/chat/markdown";
import { mockChats, mockMessages, suggestedPrompts, type Message } from "@/lib/mock/data";
import { usePageMeta } from "@/hooks/use-page-meta";
import { toast } from "sonner";

export function ChatPage() {
  usePageMeta("Chat - RAG Assistant");
  const [activeChat, setActiveChat] = React.useState<string | null>("c1");
  const [messages, setMessages] = React.useState<Message[]>(mockMessages);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            "Here's what I found in your documents:\n\n- The relevant policy is detailed in **section 3.4**.\n- Eligibility is based on **tenure** and **employment type**.\n- Approval typically takes **3–5 business days**.\n\nLet me know if you'd like me to dig deeper into any specific aspect.",
          sources: ["employee-policy.pdf · p.12", "onboarding-guide.pdf · p.4"],
        },
      ]);
      setThinking(false);
    }, 1200);
  };

  const startNew = () => {
    setActiveChat(null);
    setMessages([]);
  };

  const totalTokens = messages.length * 312;
  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 w-full">
      {/* Conversation rail */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-sidebar/40 lg:flex">
        <div className="border-b border-border p-3">
          <Button onClick={startNew} variant="outline" className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" /> New chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            <div className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recent
            </div>
            {mockChats.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveChat(c.id);
                  setMessages(mockMessages);
                }}
                className={`flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                  activeChat === c.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span className="line-clamp-1 font-medium">{c.title}</span>
                <span className="text-xs text-muted-foreground">
                  {c.updatedAt} · {c.tokens.toLocaleString()} tokens
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        {isEmpty ? (
          <EmptyState onPrompt={(p) => send(p)} />
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
              <div className="space-y-6">
                {messages.map((m) => (
                  <MessageRow key={m.id} message={m} />
                ))}
                {thinking && <ThinkingRow />}
              </div>
            </div>
          </div>
        )}

        {/* Composer */}
        <div className="border-t border-border bg-background/80 p-3 backdrop-blur sm:p-4">
          <div className="mx-auto w-full max-w-3xl">
            {!isEmpty && messages.length < 6 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {suggestedPrompts.slice(0, 3).map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            <div className="rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask anything about your documents..."
                className="min-h-[44px] resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0"
                rows={1}
              />
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  gpt-4o-mini · Tokens used: {totalTokens.toLocaleString()}
                </div>
                <Button
                  size="sm"
                  onClick={() => send()}
                  disabled={!input.trim() || thinking}
                  className="gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" /> Send
                </Button>
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Responses are generated from your indexed documents. Always verify important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: Message }) {
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
        className={`max-w-[85%] space-y-2 ${isUser ? "items-end" : "items-start"} flex flex-col`}
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
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Sources:</span>
            {message.sources.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1 font-normal">
                <FileText className="h-3 w-3" />
                {s}
              </Badge>
            ))}
          </div>
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
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Regenerate
            </Button>
          </div>
        )}
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

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
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
          Upload documents and start asking questions.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {suggestedPrompts.map((p) => (
            <button
              key={p}
              onClick={() => onPrompt(p)}
              className="rounded-xl border border-border bg-card p-3 text-left text-sm text-foreground transition-all hover:border-primary/40 hover:bg-accent/40 hover:shadow-sm"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
