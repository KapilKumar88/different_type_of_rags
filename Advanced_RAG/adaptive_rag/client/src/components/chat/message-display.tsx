import {
  CheckCircle2,
  Copy,
  FileText,
  GitBranch,
  MessageSquarePlus,
  Plus,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/chat/markdown";
import { suggestedPrompts } from "@/components/chat/chat.constants";
import { formatRelativeTime } from "@/components/chat/chat.helpers";
import type { AdaptiveRagFallbackReason, AdaptiveRagTrace, SourceChunk } from "@/types/chat.types";
import type { ChatMessage } from "@/types/chat-ui.types";
import { toast } from "sonner";

export function MessageRow({
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
        {!isUser && message.adaptiveTrace && (
          <AdaptiveTracePanel adaptiveTrace={message.adaptiveTrace} />
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
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message.content);
                  toast.success("Copied to clipboard");
                } catch {
                  toast.error("Copy failed", {
                    description: "Your browser did not allow clipboard access.",
                  });
                }
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

export function LoadingConversation() {
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

export function EmptyState({
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

function AdaptiveTracePanel({ adaptiveTrace }: Readonly<{ adaptiveTrace: AdaptiveRagTrace }>) {
  const totalRelevantSources = adaptiveTrace.retrievalAttempts.reduce(
    (total, attempt) => total + attempt.relevantCount,
    0,
  );
  const answerCheckStatus = getAnswerCheckStatus(adaptiveTrace);

  return (
    <details className="w-full rounded-lg border border-border bg-muted/20 p-3">
      <summary className="flex cursor-pointer flex-wrap items-center gap-1.5 text-xs font-medium text-foreground">
        <GitBranch className="h-3.5 w-3.5" />
        Adaptive trace
        <Badge variant="secondary" className="font-normal">
          {adaptiveTrace.route}
        </Badge>
        {adaptiveTrace.usedRewrite && (
          <Badge variant="outline" className="font-normal">
            rewrite
          </Badge>
        )}
        {adaptiveTrace.fallbackReason && (
          <Badge variant="outline" className="font-normal">
            {formatFallbackReason(adaptiveTrace.fallbackReason)}
          </Badge>
        )}
      </summary>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="font-normal">
            {adaptiveTrace.retrievalAttempts.length} retrieval attempts
          </Badge>
          <Badge variant="secondary" className="font-normal">
            {totalRelevantSources} relevant chunks
          </Badge>
          <Badge variant="secondary" className="font-normal">
            {answerCheckStatus}
          </Badge>
        </div>
        <div className="space-y-1">
          {adaptiveTrace.retrievalAttempts.map((attempt) => (
            <div
              key={`${attempt.attempt}-${attempt.query}`}
              className="rounded-md border border-border bg-background/60 px-2 py-1.5"
            >
              <div className="flex flex-wrap items-center gap-1.5 text-foreground">
                <span>Attempt {attempt.attempt}</span>
                {attempt.rewritten && (
                  <Badge variant="outline" className="font-normal">
                    rewritten
                  </Badge>
                )}
                <span>
                  {attempt.relevantCount}/{attempt.retrievedCount} relevant
                </span>
              </div>
              <p className="mt-1 max-h-10 overflow-hidden break-words">{attempt.query}</p>
            </div>
          ))}
        </div>
        <AnswerCheckRow adaptiveTrace={adaptiveTrace} />
      </div>
    </details>
  );
}

function AnswerCheckRow({ adaptiveTrace }: Readonly<{ adaptiveTrace: AdaptiveRagTrace }>) {
  const answerCheck = adaptiveTrace.answerCheck;

  if (!answerCheck) {
    return (
      <div className="flex items-center gap-1.5">
        <XCircle className="h-3.5 w-3.5" />
        Answer validation not completed
      </div>
    );
  }

  const Icon = answerCheck.grounded && answerCheck.useful ? CheckCircle2 : XCircle;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      <span>Grounded: {answerCheck.grounded ? "yes" : "no"}</span>
      <span>Useful: {answerCheck.useful ? "yes" : "no"}</span>
      {answerCheck.reason && <span className="break-words">· {answerCheck.reason}</span>}
    </div>
  );
}

function getAnswerCheckStatus(adaptiveTrace: AdaptiveRagTrace): string {
  if (!adaptiveTrace.answerCheck) {
    return "not validated";
  }

  if (adaptiveTrace.answerCheck.grounded && adaptiveTrace.answerCheck.useful) {
    return "validated";
  }

  return "fallback";
}

function formatFallbackReason(reason: AdaptiveRagFallbackReason): string {
  return reason.replaceAll("_", " ");
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
