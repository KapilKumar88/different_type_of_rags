import { Injectable } from '@nestjs/common';
import { ragConfig } from '../../config/rag.config';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { LlmService } from '../llm/llm.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { RagConcurrencyLimiterService } from '../rag-runtime/rag-concurrency-limiter.service';
import type {
  AdaptiveRagAnswerCheck,
  AdaptiveRagAnswerInput,
  AdaptiveRagAnswerResult,
  AdaptiveRagFallbackReason,
  AdaptiveRagRetrievalAttempt,
  AdaptiveRagSourceGrade,
  AdaptiveRagTrace,
} from '../../types/adaptive-rag.types';
import type { RetrievedChunk } from '../../types/rag.types';
import {
  buildAnswerCheckPrompt,
  buildAnswerPrompt,
  buildRoutePrompt,
  buildRewritePrompt,
  buildSourceGradingPrompt,
  formatConversationHistory,
  truncateEnd,
} from './adaptive-rag.prompts';
import {
  parseAnswerCheckResponse,
  parseRewriteResponse,
  parseRouteResponse,
  parseSourceGradeResponse,
} from './adaptive-rag.parsers';

type RetrievalResult = {
  query: string;
  sources: RetrievedChunk[];
  attempts: AdaptiveRagRetrievalAttempt[];
  sourceGrades: AdaptiveRagSourceGrade[];
  usedRewrite: boolean;
};

@Injectable()
export class AdaptiveRagService {
  constructor(
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
    private readonly llmService: LlmService,
    private readonly ragConcurrencyLimiter: RagConcurrencyLimiterService,
  ) {}

  async generateAnswer(
    input: AdaptiveRagAnswerInput,
  ): Promise<AdaptiveRagAnswerResult> {
    const startedAt = new Date().toISOString();
    const history = this.formatHistory(input);

    if (input.documentIds.length === 0) {
      return this.createFallbackResult(input.question, startedAt, {
        route: 'fallback',
        finalQuery: input.question,
        usedRewrite: false,
        retrievalAttempts: [],
        sourceGrades: [],
        answerCheck: null,
        fallbackReason: 'empty_document_scope',
        createdAt: startedAt,
      });
    }

    const route = await this.routeQuestion(input.question, history);

    if (route === 'fallback') {
      return this.createFallbackResult(input.question, startedAt, {
        route,
        finalQuery: input.question,
        usedRewrite: false,
        retrievalAttempts: [],
        sourceGrades: [],
        answerCheck: null,
        fallbackReason: 'non_document_question',
        createdAt: startedAt,
      });
    }

    const retrieval = await this.retrieveRelevantSources(input, history);

    if (retrieval.sources.length === 0) {
      return this.createFallbackResult(input.question, startedAt, {
        route,
        finalQuery: retrieval.query,
        usedRewrite: retrieval.usedRewrite,
        retrievalAttempts: retrieval.attempts,
        sourceGrades: retrieval.sourceGrades,
        answerCheck: null,
        fallbackReason: 'no_relevant_sources',
        createdAt: startedAt,
      });
    }

    return this.generateValidatedAnswer(input, history, startedAt, retrieval);
  }

  private async routeQuestion(
    question: string,
    history: string,
  ): Promise<'document' | 'fallback'> {
    const response = await this.ragConcurrencyLimiter.run(
      'adaptive-route',
      () => this.llmService.generateAnswer(buildRoutePrompt(question, history)),
    );

    return parseRouteResponse(response);
  }

  private async retrieveRelevantSources(
    input: AdaptiveRagAnswerInput,
    history: string,
  ): Promise<RetrievalResult> {
    const attempts: AdaptiveRagRetrievalAttempt[] = [];
    const sourceGrades: AdaptiveRagSourceGrade[] = [];
    let query = input.question;
    let usedRewrite = false;
    let relevantSources: RetrievedChunk[] = [];

    for (
      let attemptNumber = 1;
      attemptNumber <= ragConfig.adaptive.maxRetrievalAttempts;
      attemptNumber += 1
    ) {
      const attempt = await this.runRetrievalAttempt(
        input.documentIds,
        query,
        attemptNumber,
        usedRewrite,
      );

      attempts.push(attempt.summary);
      sourceGrades.push(...attempt.grades);
      relevantSources = attempt.sources;

      if (relevantSources.length > 0) {
        break;
      }

      if (attemptNumber < ragConfig.adaptive.maxRetrievalAttempts) {
        query = await this.rewriteQuery(input.question, history);
        usedRewrite = query !== input.question;
      }
    }

    return {
      query,
      sources: relevantSources,
      attempts,
      sourceGrades,
      usedRewrite,
    };
  }

  private async runRetrievalAttempt(
    documentIds: string[],
    query: string,
    attemptNumber: number,
    rewritten: boolean,
  ): Promise<{
    sources: RetrievedChunk[];
    grades: AdaptiveRagSourceGrade[];
    summary: AdaptiveRagRetrievalAttempt;
  }> {
    const vector = await this.ragConcurrencyLimiter.run('embedding', () =>
      this.embeddingsService.embedQuery(query),
    );
    const retrievedSources = await this.ragConcurrencyLimiter.run(
      'qdrant-search',
      () =>
        this.qdrantService.searchByDocumentIds(
          vector,
          ragConfig.topK,
          documentIds,
        ),
    );
    const scoreFilteredSources = this.filterByScore(retrievedSources);
    const grades = await this.gradeSources(query, scoreFilteredSources);
    const relevantSources = this.selectRelevantSources(
      scoreFilteredSources,
      grades,
    );

    return {
      sources: relevantSources,
      grades,
      summary: {
        attempt: attemptNumber,
        query,
        rewritten,
        retrievedCount: retrievedSources.length,
        relevantCount: relevantSources.length,
        maxScore: this.getMaxScore(retrievedSources),
        minScoreThreshold: ragConfig.adaptive.minSourceScore,
      },
    };
  }

  private filterByScore(sources: RetrievedChunk[]): RetrievedChunk[] {
    return sources
      .filter((source) => source.score >= ragConfig.adaptive.minSourceScore)
      .slice(0, ragConfig.adaptive.maxGradedSources);
  }

  private async gradeSources(
    query: string,
    sources: RetrievedChunk[],
  ): Promise<AdaptiveRagSourceGrade[]> {
    if (sources.length === 0) {
      return [];
    }

    const response = await this.ragConcurrencyLimiter.run(
      'adaptive-source-grade',
      () =>
        this.llmService.generateAnswer(buildSourceGradingPrompt(query, sources)),
    );

    return parseSourceGradeResponse(response, sources);
  }

  private selectRelevantSources(
    sources: RetrievedChunk[],
    grades: AdaptiveRagSourceGrade[],
  ): RetrievedChunk[] {
    const relevantChunkIds = new Set(
      grades.filter((grade) => grade.relevant).map((grade) => grade.chunkId),
    );

    return sources.filter((source) => relevantChunkIds.has(source.chunkId));
  }

  private async rewriteQuery(question: string, history: string): Promise<string> {
    const response = await this.ragConcurrencyLimiter.run(
      'adaptive-rewrite',
      () => this.llmService.generateAnswer(buildRewritePrompt(question, history)),
    );

    return parseRewriteResponse(response, question);
  }

  private async generateValidatedAnswer(
    input: AdaptiveRagAnswerInput,
    history: string,
    startedAt: string,
    retrieval: RetrievalResult,
  ): Promise<AdaptiveRagAnswerResult> {
    let latestAnswerCheck: AdaptiveRagAnswerCheck | null = null;

    for (
      let attemptNumber = 1;
      attemptNumber <= ragConfig.adaptive.maxAnswerAttempts;
      attemptNumber += 1
    ) {
      const answer = await this.generateCandidateAnswer(
        input.question,
        history,
        retrieval.sources,
        attemptNumber > 1,
      );

      if (!answer) {
        latestAnswerCheck = null;
        continue;
      }

      latestAnswerCheck = await this.checkAnswer(
        input.question,
        answer,
        retrieval.sources,
      );

      if (latestAnswerCheck.grounded && latestAnswerCheck.useful) {
        return {
          answer,
          sources: retrieval.sources,
          trace: this.createTrace(
            retrieval,
            latestAnswerCheck,
            null,
            startedAt,
          ),
        };
      }
    }

    const fallbackReason = latestAnswerCheck
      ? 'ungrounded_answer'
      : 'empty_answer';

    return this.createFallbackResult(
      input.question,
      startedAt,
      {
        ...this.createTrace(
          retrieval,
          latestAnswerCheck,
          fallbackReason,
          startedAt,
        ),
        route: 'document',
      },
      retrieval.sources,
    );
  }

  private async generateCandidateAnswer(
    question: string,
    history: string,
    sources: RetrievedChunk[],
    strictGrounding: boolean,
  ): Promise<string> {
    const answer = await this.ragConcurrencyLimiter.run(
      'adaptive-answer',
      () =>
        this.llmService.generateAnswer(
          buildAnswerPrompt(question, history, sources, strictGrounding),
        ),
    );

    return answer.trim();
  }

  private async checkAnswer(
    question: string,
    answer: string,
    sources: RetrievedChunk[],
  ): Promise<AdaptiveRagAnswerCheck> {
    const response = await this.ragConcurrencyLimiter.run(
      'adaptive-answer-check',
      () =>
        this.llmService.generateAnswer(
          buildAnswerCheckPrompt(question, answer, sources),
        ),
    );

    return parseAnswerCheckResponse(response);
  }

  private createTrace(
    retrieval: RetrievalResult,
    answerCheck: AdaptiveRagAnswerCheck | null,
    fallbackReason: AdaptiveRagFallbackReason | null,
    createdAt: string,
  ): AdaptiveRagTrace {
    return {
      route: 'document',
      finalQuery: retrieval.query,
      usedRewrite: retrieval.usedRewrite,
      retrievalAttempts: retrieval.attempts,
      sourceGrades: retrieval.sourceGrades,
      answerCheck,
      fallbackReason,
      createdAt,
    };
  }

  private createFallbackResult(
    question: string,
    createdAt: string,
    trace: AdaptiveRagTrace,
    sources: RetrievedChunk[] = [],
  ): AdaptiveRagAnswerResult {
    return {
      answer: ragConfig.fallbackAnswer,
      sources,
      trace: {
        ...trace,
        finalQuery: truncateEnd(trace.finalQuery || question, 500),
        createdAt,
      },
    };
  }

  private getMaxScore(sources: RetrievedChunk[]): number | null {
    if (sources.length === 0) {
      return null;
    }

    return Math.max(...sources.map((source) => source.score));
  }

  private formatHistory(input: AdaptiveRagAnswerInput): string {
    return formatConversationHistory(
      input.messages,
      input.question,
      ragConfig.maxPromptHistoryCharacters,
    );
  }
}
