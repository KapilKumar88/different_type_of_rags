import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  MessageSquarePlus,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/chat/markdown";
import { suggestedPrompts } from "@/components/chat/chat.constants";
import { formatRelativeTime } from "@/components/chat/chat.helpers";
import type {
  CorrectiveRagAttemptTrace,
  CorrectiveRagFinalDecision,
  CorrectiveRagWebSearchStatus,
  MultiQueryRetrievalMetadata,
  MessageSource,
  RetrievalMetadata,
  SelfRagAttemptTrace,
  SelfRagChunkEvaluation,
  SelfRagFinalDecision,
  WebSource,
} from "@/types/chat.types";
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
        {!isUser && message.retrievalMetadata && (
          <RetrievalAudit retrievalMetadata={message.retrievalMetadata} />
        )}
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

function RetrievalAudit({ retrievalMetadata }: Readonly<{ retrievalMetadata: RetrievalMetadata }>) {
  if (retrievalMetadata.strategy === "corrective_rag") {
    return <CorrectiveRagTrace retrievalMetadata={retrievalMetadata} />;
  }

  if (retrievalMetadata.strategy === "self_rag") {
    return <SelfRagTrace retrievalMetadata={retrievalMetadata} />;
  }

  return <MultiQueryAudit retrievalMetadata={retrievalMetadata} />;
}

function CorrectiveRagTrace({
  retrievalMetadata,
}: Readonly<{
  retrievalMetadata: Extract<RetrievalMetadata, { strategy: "corrective_rag" }>;
}>) {
  const answerEvaluation = retrievalMetadata.answerEvaluation;
  const webSearch = retrievalMetadata.webSearch;

  return (
    <details className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Corrective RAG trace</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <CorrectiveDecisionBadge decision={retrievalMetadata.finalDecision} />
          <WebSearchBadge status={webSearch.status} />
        </span>
      </summary>

      <div className="mt-3 space-y-3">
        <TraceSection title="Answer check">
          <div className="flex flex-wrap items-center gap-1.5">
            <EvaluationBadge
              value={answerEvaluation.verdict}
              icon={<CheckCircle2 className="h-3 w-3" />}
            />
            <EvaluationBadge
              value={answerEvaluation.utility}
              icon={<Sparkles className="h-3 w-3" />}
            />
          </div>
          <p className="mt-1.5 leading-5 text-muted-foreground">{answerEvaluation.reason}</p>
        </TraceSection>

        <TraceSection title="Web fallback">
          <div className="flex flex-wrap items-center gap-1.5">
            <WebSearchBadge status={webSearch.status} />
            <Badge variant="secondary" className="font-normal">
              {webSearch.resultCount} results
            </Badge>
          </div>
          {webSearch.query && <TraceLine label="Query" value={webSearch.query} />}
          {webSearch.reason && (
            <p className="mt-1.5 leading-5 text-muted-foreground">{webSearch.reason}</p>
          )}
        </TraceSection>

        <TraceSection title="Queries">
          <ol className="space-y-1">
            {retrievalMetadata.generatedQueries.map((query, index) => (
              <li key={`${query}-${index}`} className="flex min-w-0 gap-2 text-muted-foreground">
                <span className="shrink-0 tabular-nums">{index + 1}.</span>
                <span className="min-w-0 break-words">{query}</span>
              </li>
            ))}
          </ol>
        </TraceSection>

        <div className="space-y-2">
          {retrievalMetadata.attempts.map((attempt) => (
            <CorrectiveAttemptTrace key={attempt.attemptNumber} attempt={attempt} />
          ))}
        </div>
      </div>
    </details>
  );
}

function MultiQueryAudit({
  retrievalMetadata,
}: Readonly<{ retrievalMetadata: MultiQueryRetrievalMetadata }>) {
  const queryLabel =
    retrievalMetadata.usedQueryCount === 1 ? "Generated search query" : "Generated search queries";

  return (
    <div className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">{queryLabel}</span>
        <span className="shrink-0 text-muted-foreground">{retrievalMetadata.usedQueryCount}</span>
      </div>
      <ol className="space-y-1">
        {retrievalMetadata.generatedQueries.map((query, index) => (
          <li key={`${query}-${index}`} className="flex min-w-0 gap-2 text-muted-foreground">
            <span className="shrink-0 tabular-nums">{index + 1}.</span>
            <span className="min-w-0 break-words">{query}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SelfRagTrace({
  retrievalMetadata,
}: Readonly<{
  retrievalMetadata: Extract<RetrievalMetadata, { strategy: "self_rag" }>;
}>) {
  const answerEvaluation = retrievalMetadata.answerEvaluation;

  return (
    <details className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Self-RAG trace</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <DecisionBadge decision={retrievalMetadata.finalDecision} />
          <span className="text-muted-foreground">{retrievalMetadata.attempts.length} tries</span>
        </span>
      </summary>

      <div className="mt-3 space-y-3">
        <TraceSection title="Answer check">
          <div className="flex flex-wrap items-center gap-1.5">
            <EvaluationBadge
              value={answerEvaluation.verdict}
              icon={<CheckCircle2 className="h-3 w-3" />}
            />
            <EvaluationBadge
              value={answerEvaluation.utility}
              icon={<Sparkles className="h-3 w-3" />}
            />
          </div>
          <p className="mt-1.5 leading-5 text-muted-foreground">{answerEvaluation.reason}</p>
        </TraceSection>

        <TraceSection title="Queries">
          <ol className="space-y-1">
            {retrievalMetadata.generatedQueries.map((query, index) => (
              <li key={`${query}-${index}`} className="flex min-w-0 gap-2 text-muted-foreground">
                <span className="shrink-0 tabular-nums">{index + 1}.</span>
                <span className="min-w-0 break-words">{query}</span>
              </li>
            ))}
          </ol>
        </TraceSection>

        <div className="space-y-2">
          {retrievalMetadata.attempts.map((attempt) => (
            <AttemptTrace key={attempt.attemptNumber} attempt={attempt} />
          ))}
        </div>
      </div>
    </details>
  );
}

function CorrectiveAttemptTrace({
  attempt,
}: Readonly<{
  attempt: CorrectiveRagAttemptTrace;
}>) {
  const title = attempt.attemptType === "initial_local" ? "Initial local" : "Corrective local";

  return (
    <details className="border-t border-border pt-2" open={attempt.attemptNumber === 1}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-foreground">
        <span className="flex items-center gap-1.5 font-medium">
          <Search className="h-3.5 w-3.5" />
          {title}
        </span>
        <span className="flex items-center gap-1.5">
          <RetrievalStatusBadge status={attempt.assessment.status} />
          <span className="text-muted-foreground">
            {attempt.acceptedChunkCount}/{attempt.retrievedChunkCount} accepted
          </span>
        </span>
      </summary>

      <div className="mt-2 space-y-2">
        <TraceLine label="Seed" value={attempt.seedQuery} />
        {attempt.correctiveQuery && (
          <TraceLine
            label="Corrected"
            value={attempt.correctiveQuery}
            icon={<RotateCw className="h-3 w-3" />}
          />
        )}
        <p className="leading-5 text-muted-foreground">{attempt.assessment.reason}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="font-normal">
            {attempt.retrievedChunkCount} retrieved
          </Badge>
          <Badge variant="secondary" className="font-normal">
            {attempt.acceptedChunkCount} accepted
          </Badge>
          <Badge variant="outline" className="font-normal">
            {attempt.rejectedChunkCount} rejected
          </Badge>
        </div>
        <ChunkEvaluationList evaluations={attempt.chunkEvaluations} />
      </div>
    </details>
  );
}

function AttemptTrace({ attempt }: Readonly<{ attempt: SelfRagAttemptTrace }>) {
  return (
    <details className="border-t border-border pt-2" open={attempt.attemptNumber === 1}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-foreground">
        <span className="flex items-center gap-1.5 font-medium">
          <Search className="h-3.5 w-3.5" />
          Attempt {attempt.attemptNumber}
        </span>
        <span className="text-muted-foreground">
          {attempt.acceptedChunkCount}/{attempt.retrievedChunkCount} accepted
        </span>
      </summary>

      <div className="mt-2 space-y-2">
        <TraceLine label="Seed" value={attempt.seedQuery} />
        {attempt.refinementQuery && (
          <TraceLine
            label="Retry"
            value={attempt.refinementQuery}
            icon={<RotateCw className="h-3 w-3" />}
          />
        )}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="font-normal">
            {attempt.retrievedChunkCount} retrieved
          </Badge>
          <Badge variant="secondary" className="font-normal">
            {attempt.acceptedChunkCount} accepted
          </Badge>
          <Badge variant="outline" className="font-normal">
            {attempt.rejectedChunkCount} rejected
          </Badge>
        </div>
        <ChunkEvaluationList evaluations={attempt.chunkEvaluations} />
      </div>
    </details>
  );
}

function ChunkEvaluationList({ evaluations }: Readonly<{ evaluations: SelfRagChunkEvaluation[] }>) {
  if (evaluations.length === 0) {
    return <p className="text-muted-foreground">No chunk evaluations recorded.</p>;
  }

  return (
    <div className="space-y-1.5">
      {evaluations.map((evaluation) => (
        <div
          key={evaluation.chunkId}
          className="rounded-md border border-border/70 bg-background/50 p-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 break-words font-medium text-foreground">
              {evaluation.fileName}
              {evaluation.pageNumber ? ` · p.${evaluation.pageNumber}` : ""}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              <EvaluationBadge
                value={formatChunkVerdict(evaluation.verdict)}
                icon={getChunkVerdictIcon(evaluation.verdict)}
              />
              <span className="text-muted-foreground">{evaluation.score.toFixed(3)}</span>
            </span>
          </div>
          <p className="mt-1 leading-5 text-muted-foreground">{evaluation.reason}</p>
        </div>
      ))}
    </div>
  );
}

function TraceSection({
  title,
  children,
}: Readonly<{
  title: string;
  children: ReactNode;
}>) {
  return (
    <section className="border-t border-border pt-2 first:border-t-0 first:pt-0">
      <p className="mb-1.5 font-medium text-foreground">{title}</p>
      {children}
    </section>
  );
}

function TraceLine({
  label,
  value,
  icon,
}: Readonly<{
  label: string;
  value: string;
  icon?: ReactNode;
}>) {
  return (
    <div className="flex min-w-0 gap-2 text-muted-foreground">
      <span className="flex shrink-0 items-center gap-1 font-medium text-foreground">
        {icon}
        {label}
      </span>
      <span className="min-w-0 break-words">{value}</span>
    </div>
  );
}

function DecisionBadge({ decision }: Readonly<{ decision: SelfRagFinalDecision }>) {
  const label = formatDecision(decision);
  const className = getDecisionClassName(decision);

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

function CorrectiveDecisionBadge({
  decision,
}: Readonly<{
  decision: CorrectiveRagFinalDecision;
}>) {
  return (
    <Badge variant="outline" className={getCorrectiveDecisionClassName(decision)}>
      {formatCorrectiveDecision(decision)}
    </Badge>
  );
}

function RetrievalStatusBadge({
  status,
}: Readonly<{
  status: CorrectiveRagAttemptTrace["assessment"]["status"];
}>) {
  return (
    <Badge variant="secondary" className="font-normal">
      {formatEvaluationValue(status)}
    </Badge>
  );
}

function WebSearchBadge({
  status,
}: Readonly<{
  status: CorrectiveRagWebSearchStatus;
}>) {
  return (
    <Badge variant={status === "searched" ? "secondary" : "outline"} className="gap-1 font-normal">
      <Globe className="h-3 w-3" />
      {formatWebSearchStatus(status)}
    </Badge>
  );
}

function EvaluationBadge({
  value,
  icon,
}: Readonly<{
  value: string;
  icon: ReactNode;
}>) {
  return (
    <Badge variant="secondary" className="gap-1 font-normal">
      {icon}
      {formatEvaluationValue(value)}
    </Badge>
  );
}

function formatDecision(decision: SelfRagFinalDecision): string {
  switch (decision) {
    case "answered":
      return "Answered";
    case "insufficient_context":
      return "Insufficient context";
    case "unsupported_answer":
      return "Unsupported";
    case "evaluation_degraded":
      return "Evaluation degraded";
  }
}

function formatCorrectiveDecision(decision: CorrectiveRagFinalDecision): string {
  switch (decision) {
    case "answered_with_local_context":
      return "Local answer";
    case "answered_with_corrected_context":
      return "Corrected answer";
    case "answered_with_web_context":
      return "Web answer";
    case "insufficient_context":
      return "Insufficient context";
    case "unsupported_answer":
      return "Unsupported";
    case "evaluation_degraded":
      return "Evaluation degraded";
  }
}

function getDecisionClassName(decision: SelfRagFinalDecision): string {
  switch (decision) {
    case "answered":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "insufficient_context":
      return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "unsupported_answer":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    case "evaluation_degraded":
      return "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  }
}

function getCorrectiveDecisionClassName(decision: CorrectiveRagFinalDecision): string {
  switch (decision) {
    case "answered_with_local_context":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "answered_with_corrected_context":
      return "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300";
    case "answered_with_web_context":
      return "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "insufficient_context":
      return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "unsupported_answer":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    case "evaluation_degraded":
      return "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300";
  }
}

function formatWebSearchStatus(status: CorrectiveRagWebSearchStatus): string {
  switch (status) {
    case "not_needed":
      return "Web not needed";
    case "disabled":
      return "Web disabled";
    case "searched":
      return "Web searched";
    case "no_results":
      return "No web results";
    case "failed":
      return "Web failed";
  }
}

function formatChunkVerdict(verdict: SelfRagChunkEvaluation["verdict"]): string {
  switch (verdict) {
    case "relevant":
      return "relevant";
    case "partially_relevant":
      return "partial";
    case "irrelevant":
      return "irrelevant";
    case "not_evaluated":
      return "not evaluated";
  }
}

function getChunkVerdictIcon(verdict: SelfRagChunkEvaluation["verdict"]) {
  switch (verdict) {
    case "relevant":
      return <CheckCircle2 className="h-3 w-3" />;
    case "partially_relevant":
      return <AlertTriangle className="h-3 w-3" />;
    case "irrelevant":
      return <XCircle className="h-3 w-3" />;
    case "not_evaluated":
      return <ShieldCheck className="h-3 w-3" />;
  }
}

function formatEvaluationValue(value: string): string {
  return value.replace(/_/g, " ");
}

function SourceChunks({ sources }: Readonly<{ sources: MessageSource[] }>) {
  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Retrieved sources:</span>
        {sources.map((source) => (
          <SourceBadge key={getSourceKey(source)} source={source} />
        ))}
      </div>
      <div className="space-y-2">
        {sources.map((source, index) => (
          <SourceDetails key={getSourceKey(source)} source={source} index={index} />
        ))}
      </div>
    </div>
  );
}

function SourceBadge({ source }: Readonly<{ source: MessageSource }>) {
  if (isWebSource(source)) {
    return (
      <Badge variant="secondary" className="max-w-full gap-1 font-normal">
        <Globe className="h-3 w-3 shrink-0" />
        <span className="min-w-0 truncate">{source.title}</span>
        {` · ${source.score.toFixed(3)}`}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="max-w-full gap-1 font-normal">
      <FileText className="h-3 w-3 shrink-0" />
      <span className="min-w-0 truncate">{source.fileName}</span>
      {source.pageNumber !== undefined ? ` · p.${source.pageNumber}` : ""}
      {` · ${source.score.toFixed(3)}`}
    </Badge>
  );
}

function SourceDetails({
  source,
  index,
}: Readonly<{
  source: MessageSource;
  index: number;
}>) {
  if (isWebSource(source)) {
    return (
      <details className="rounded-lg border border-border bg-muted/30 p-3">
        <summary className="cursor-pointer text-xs font-medium text-foreground">
          Source {index + 1}: {source.title}
        </summary>
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex min-w-0 items-center gap-1 break-all text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          {source.url}
        </a>
        <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
          {source.content}
        </p>
      </details>
    );
  }

  return (
    <details className="rounded-lg border border-border bg-muted/30 p-3">
      <summary className="cursor-pointer text-xs font-medium text-foreground">
        Source {index + 1}: {source.fileName}
        {source.pageNumber !== undefined ? ` · page ${source.pageNumber}` : ""}
      </summary>
      <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
        {source.text}
      </p>
    </details>
  );
}

function getSourceKey(source: MessageSource): string {
  if (isWebSource(source)) {
    return source.sourceId;
  }

  return source.chunkId;
}

function isWebSource(source: MessageSource): source is WebSource {
  return source.sourceType === "web";
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
