import { Logger } from '@nestjs/common';
import type {
  RetrievedChunk,
  WebSearchSource,
} from '../../types/rag.types';
import { LlmService } from '../llm/llm.service';
import { CorrectiveRagEvaluatorService } from './corrective-rag-evaluator.service';

function createChunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    chunkId: 'chunk-1',
    documentId: 'document-1',
    fileName: 'notes.txt',
    text: 'Corrective RAG evaluates local retrieval before answering.',
    createdAt: '2026-01-01T00:00:00.000Z',
    score: 0.91,
    ...overrides,
  };
}

function createWebSource(
  overrides: Partial<WebSearchSource> = {},
): WebSearchSource {
  return {
    sourceType: 'web',
    sourceId: 'tavily-1',
    title: 'Corrective RAG overview',
    url: 'https://example.com/crag',
    content: 'Corrective RAG can use web search after local retrieval fails.',
    score: 0.88,
    provider: 'tavily',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('CorrectiveRagEvaluatorService', () => {
  let llmService: jest.Mocked<LlmService>;
  let service: CorrectiveRagEvaluatorService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    llmService = {
      generateAnswer: jest.fn(),
      streamAnswer: jest.fn(),
    } as unknown as jest.Mocked<LlmService>;
    service = new CorrectiveRagEvaluatorService(llmService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('parses fenced retrieval JSON and attaches chunk metadata', async () => {
    llmService.generateAnswer.mockResolvedValue(
      [
        '```json',
        JSON.stringify({
          status: 'correct',
          reason: 'The retrieved chunk answers the question.',
          evaluations: [
            {
              chunkId: 'chunk-1',
              verdict: 'relevant',
              reason: 'Directly explains Corrective RAG.',
            },
          ],
        }),
        '```',
      ].join('\n'),
    );

    const result = await service.evaluateRetrieval({
      latestUserMessage: 'How does Corrective RAG work?',
      historyMessages: [],
      chunks: [createChunk()],
    });

    expect(result).toEqual({
      assessment: {
        status: 'correct',
        reason: 'The retrieved chunk answers the question.',
      },
      chunkEvaluations: [
        {
          chunkId: 'chunk-1',
          fileName: 'notes.txt',
          pageNumber: undefined,
          score: 0.91,
          verdict: 'relevant',
          reason: 'Directly explains Corrective RAG.',
        },
      ],
    });
  });

  it('marks empty local retrieval as incorrect without calling the LLM', async () => {
    const result = await service.evaluateRetrieval({
      latestUserMessage: 'Missing topic?',
      historyMessages: [],
      chunks: [],
    });

    expect(result).toEqual({
      assessment: {
        status: 'incorrect',
        reason: 'No local document chunks were retrieved.',
      },
      chunkEvaluations: [],
    });
    expect(llmService.generateAnswer).not.toHaveBeenCalled();
  });

  it('returns not_evaluated retrieval defaults when JSON is malformed', async () => {
    llmService.generateAnswer.mockResolvedValue('not json');

    const result = await service.evaluateRetrieval({
      latestUserMessage: 'How does Corrective RAG work?',
      historyMessages: [],
      chunks: [createChunk()],
    });

    expect(result.assessment).toEqual({
      status: 'not_evaluated',
      reason: 'Evaluation unavailable.',
    });
    expect(result.chunkEvaluations[0]).toMatchObject({
      chunkId: 'chunk-1',
      verdict: 'not_evaluated',
      reason: 'Evaluation unavailable.',
    });
  });

  it('parses answer support JSON for web sources and bounds long reasons', async () => {
    llmService.generateAnswer.mockResolvedValue(
      JSON.stringify({
        verdict: 'supported',
        utility: 'high',
        reason: 'x'.repeat(500),
      }),
    );

    const result = await service.evaluateAnswerSupport({
      latestUserMessage: 'What happens after local retrieval fails?',
      historyMessages: [],
      answer: 'Corrective RAG can use web search.',
      sources: [createWebSource()],
    });

    expect(result.verdict).toBe('supported');
    expect(result.utility).toBe('high');
    expect(result.reason).toHaveLength(220);
    expect(llmService.generateAnswer.mock.calls[0]?.[0]).toContain(
      'Web source 1',
    );
  });

  it('returns not_evaluated answer defaults when support grading fails', async () => {
    llmService.generateAnswer.mockRejectedValue(new Error('provider failed'));

    const result = await service.evaluateAnswerSupport({
      latestUserMessage: 'What is Corrective RAG?',
      historyMessages: [],
      answer: 'Corrective RAG grades retrieval.',
      sources: [createChunk()],
    });

    expect(result).toEqual({
      verdict: 'not_evaluated',
      utility: 'not_evaluated',
      reason: 'Evaluation unavailable.',
    });
  });

  it('parses corrective query JSON and normalizes whitespace', async () => {
    llmService.generateAnswer.mockResolvedValue(
      JSON.stringify({ query: '  corrective rag web fallback  ' }),
    );

    const result = await service.generateCorrectiveQuery({
      originalQuery: 'Explain it',
      failedQuery: 'Explain it',
      reason: 'Local retrieval was incorrect.',
      historyMessages: [],
    });

    expect(result).toBe('corrective rag web fallback');
  });

  it('returns null when corrective query JSON is malformed', async () => {
    llmService.generateAnswer.mockResolvedValue('[]');

    const result = await service.generateCorrectiveQuery({
      originalQuery: 'Explain it',
      failedQuery: 'Explain it',
      reason: 'Local retrieval was incorrect.',
      historyMessages: [],
    });

    expect(result).toBeNull();
  });
});
