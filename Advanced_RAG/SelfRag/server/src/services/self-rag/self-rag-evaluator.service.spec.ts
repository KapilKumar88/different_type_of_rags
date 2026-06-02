import { Logger } from '@nestjs/common';
import type { RetrievedChunk } from '../../types/rag.types';
import { LlmService } from '../llm/llm.service';
import { SelfRagEvaluatorService } from './self-rag-evaluator.service';

function createChunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    chunkId: 'chunk-1',
    documentId: 'document-1',
    fileName: 'notes.txt',
    text: 'Self-RAG grades retrieved context before answering.',
    createdAt: '2026-01-01T00:00:00.000Z',
    score: 0.91,
    ...overrides,
  };
}

describe('SelfRagEvaluatorService', () => {
  let llmService: jest.Mocked<LlmService>;
  let service: SelfRagEvaluatorService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    llmService = {
      generateAnswer: jest.fn(),
      streamAnswer: jest.fn(),
    } as unknown as jest.Mocked<LlmService>;
    service = new SelfRagEvaluatorService(llmService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('parses fenced relevance JSON and attaches chunk metadata', async () => {
    llmService.generateAnswer.mockResolvedValue(
      [
        '```json',
        JSON.stringify({
          evaluations: [
            {
              chunkId: 'chunk-1',
              verdict: 'relevant',
              reason: 'Directly explains Self-RAG grading.',
            },
          ],
        }),
        '```',
      ].join('\n'),
    );

    const result = await service.evaluateChunkRelevance({
      latestUserMessage: 'How does Self-RAG work?',
      historyMessages: [],
      chunks: [createChunk()],
    });

    expect(result).toEqual([
      {
        chunkId: 'chunk-1',
        fileName: 'notes.txt',
        pageNumber: undefined,
        score: 0.91,
        verdict: 'relevant',
        reason: 'Directly explains Self-RAG grading.',
      },
    ]);
  });

  it('returns not_evaluated relevance defaults when JSON is malformed', async () => {
    llmService.generateAnswer.mockResolvedValue('not json');

    const result = await service.evaluateChunkRelevance({
      latestUserMessage: 'How does Self-RAG work?',
      historyMessages: [],
      chunks: [createChunk()],
    });

    expect(result).toEqual([
      {
        chunkId: 'chunk-1',
        fileName: 'notes.txt',
        pageNumber: undefined,
        score: 0.91,
        verdict: 'not_evaluated',
        reason: 'Evaluation unavailable.',
      },
    ]);
  });

  it('parses answer support JSON and bounds long reasons', async () => {
    llmService.generateAnswer.mockResolvedValue(
      JSON.stringify({
        verdict: 'supported',
        utility: 'high',
        reason: 'x'.repeat(500),
      }),
    );

    const result = await service.evaluateAnswerSupport({
      latestUserMessage: 'What is Self-RAG?',
      historyMessages: [],
      answer: 'Self-RAG grades retrieval and answer support.',
      sources: [createChunk()],
    });

    expect(result.verdict).toBe('supported');
    expect(result.utility).toBe('high');
    expect(result.reason).toHaveLength(220);
  });

  it('returns not_evaluated answer defaults when support grading fails', async () => {
    llmService.generateAnswer.mockRejectedValue(new Error('provider failed'));

    const result = await service.evaluateAnswerSupport({
      latestUserMessage: 'What is Self-RAG?',
      historyMessages: [],
      answer: 'Self-RAG grades retrieval and answer support.',
      sources: [createChunk()],
    });

    expect(result).toEqual({
      verdict: 'not_evaluated',
      utility: 'not_evaluated',
      reason: 'Evaluation unavailable.',
    });
  });

  it('parses refinement query JSON and normalizes whitespace', async () => {
    llmService.generateAnswer.mockResolvedValue(
      JSON.stringify({ query: '  self rag answer support grading  ' }),
    );

    const result = await service.generateRefinementQuery({
      originalQuery: 'Explain it',
      failedQuery: 'Explain it',
      reason: 'Prior answer was unsupported.',
      historyMessages: [],
    });

    expect(result).toBe('self rag answer support grading');
  });

  it('returns null when refinement query JSON is malformed', async () => {
    llmService.generateAnswer.mockResolvedValue('[]');

    const result = await service.generateRefinementQuery({
      originalQuery: 'Explain it',
      failedQuery: 'Explain it',
      reason: 'Prior answer was unsupported.',
      historyMessages: [],
    });

    expect(result).toBeNull();
  });
});
