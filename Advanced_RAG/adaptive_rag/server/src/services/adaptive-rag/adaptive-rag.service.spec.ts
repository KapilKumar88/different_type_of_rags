import { ragConfig } from '../../config/rag.config';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { LlmService } from '../llm/llm.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { RagConcurrencyLimiterService } from '../rag-runtime/rag-concurrency-limiter.service';
import type { RetrievedChunk } from '../../types/rag.types';
import { AdaptiveRagService } from './adaptive-rag.service';

function createChunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    chunkId: 'chunk-1',
    documentId: 'document-1',
    fileName: 'rag-notes.txt',
    text: 'Adaptive RAG retrieves, grades, and validates document-grounded answers.',
    createdAt: '2026-01-01T00:00:00.000Z',
    score: 0.91,
    ...overrides,
  };
}

describe('AdaptiveRagService', () => {
  let embeddingsService: jest.Mocked<EmbeddingsService>;
  let qdrantService: jest.Mocked<QdrantService>;
  let llmService: jest.Mocked<LlmService>;
  let ragConcurrencyLimiter: jest.Mocked<RagConcurrencyLimiterService>;
  let service: AdaptiveRagService;

  beforeEach(() => {
    embeddingsService = {
      embedQuery: jest.fn(),
    } as unknown as jest.Mocked<EmbeddingsService>;
    qdrantService = {
      searchByDocumentIds: jest.fn(),
    } as unknown as jest.Mocked<QdrantService>;
    llmService = {
      generateAnswer: jest.fn(),
    } as unknown as jest.Mocked<LlmService>;
    ragConcurrencyLimiter = {
      run: jest.fn(async (_key, task: () => Promise<unknown>) => task()),
    } as unknown as jest.Mocked<RagConcurrencyLimiterService>;
    service = new AdaptiveRagService(
      embeddingsService,
      qdrantService,
      llmService,
      ragConcurrencyLimiter,
    );
  });

  it('generates a grounded answer from relevant document sources', async () => {
    const source = createChunk();
    embeddingsService.embedQuery.mockResolvedValue(Array(768).fill(0.1));
    qdrantService.searchByDocumentIds.mockResolvedValue([source]);
    llmService.generateAnswer
      .mockResolvedValueOnce('{"route":"document","reason":"document question"}')
      .mockResolvedValueOnce(
        '{"grades":[{"chunkId":"chunk-1","relevant":true,"reason":"directly relevant"}]}',
      )
      .mockResolvedValueOnce('Adaptive RAG validates answers against sources.')
      .mockResolvedValueOnce(
        '{"grounded":true,"useful":true,"reason":"supported"}',
      );

    const result = await service.generateAnswer({
      question: 'What does the document say about Adaptive RAG?',
      documentIds: ['document-1'],
      messages: [],
    });

    expect(result.answer).toBe('Adaptive RAG validates answers against sources.');
    expect(result.sources).toEqual([source]);
    expect(result.trace.fallbackReason).toBeNull();
    expect(result.trace.answerCheck).toEqual({
      grounded: true,
      useful: true,
      reason: 'supported',
    });
    expect(qdrantService.searchByDocumentIds).toHaveBeenCalledWith(
      Array(768).fill(0.1),
      ragConfig.topK,
      ['document-1'],
    );
  });

  it('rewrites the query and retries scoped retrieval when the first pass is weak', async () => {
    const weakSource = createChunk({ chunkId: 'weak-chunk', score: 0.1 });
    const strongSource = createChunk({ chunkId: 'strong-chunk', score: 0.93 });
    embeddingsService.embedQuery
      .mockResolvedValueOnce(Array(768).fill(0.1))
      .mockResolvedValueOnce(Array(768).fill(0.2));
    qdrantService.searchByDocumentIds
      .mockResolvedValueOnce([weakSource])
      .mockResolvedValueOnce([strongSource]);
    llmService.generateAnswer
      .mockResolvedValueOnce('{"route":"document"}')
      .mockResolvedValueOnce('{"query":"adaptive rag validation flow"}')
      .mockResolvedValueOnce(
        '{"grades":[{"chunkId":"strong-chunk","relevant":true}]}',
      )
      .mockResolvedValueOnce('It validates generated answers.')
      .mockResolvedValueOnce('{"grounded":true,"useful":true}');

    const result = await service.generateAnswer({
      question: 'What does it do?',
      documentIds: ['document-1'],
      messages: [
        {
          role: 'user',
          content: 'Tell me about Adaptive RAG.',
        },
      ],
    });

    expect(result.answer).toBe('It validates generated answers.');
    expect(result.sources).toEqual([strongSource]);
    expect(result.trace.usedRewrite).toBe(true);
    expect(result.trace.finalQuery).toBe('adaptive rag validation flow');
    expect(result.trace.retrievalAttempts).toEqual([
      expect.objectContaining({
        attempt: 1,
        query: 'What does it do?',
        retrievedCount: 1,
        relevantCount: 0,
      }),
      expect.objectContaining({
        attempt: 2,
        query: 'adaptive rag validation flow',
        rewritten: true,
        retrievedCount: 1,
        relevantCount: 1,
      }),
    ]);
    expect(qdrantService.searchByDocumentIds).toHaveBeenCalledTimes(2);
  });

  it('returns the fallback answer when scoped retrieval finds no sources after retry', async () => {
    embeddingsService.embedQuery
      .mockResolvedValueOnce(Array(768).fill(0.1))
      .mockResolvedValueOnce(Array(768).fill(0.2));
    qdrantService.searchByDocumentIds.mockResolvedValue([]);
    llmService.generateAnswer
      .mockResolvedValueOnce('{"route":"document"}')
      .mockResolvedValueOnce('{"query":"rewritten document query"}');

    const result = await service.generateAnswer({
      question: 'Where is the deployment checklist?',
      documentIds: ['document-1'],
      messages: [],
    });

    expect(result.answer).toBe(ragConfig.fallbackAnswer);
    expect(result.sources).toEqual([]);
    expect(result.trace.fallbackReason).toBe('no_relevant_sources');
    expect(result.trace.retrievalAttempts).toHaveLength(2);
    expect(llmService.generateAnswer).toHaveBeenCalledTimes(2);
  });

  it('falls back conservatively when source grading JSON is invalid', async () => {
    const source = createChunk();
    embeddingsService.embedQuery
      .mockResolvedValueOnce(Array(768).fill(0.1))
      .mockResolvedValueOnce(Array(768).fill(0.2));
    qdrantService.searchByDocumentIds.mockResolvedValue([source]);
    llmService.generateAnswer
      .mockResolvedValueOnce('{"route":"document"}')
      .mockResolvedValueOnce('not-json')
      .mockResolvedValueOnce('{"query":"rewritten query"}')
      .mockResolvedValueOnce('still not json');

    const result = await service.generateAnswer({
      question: 'What is the risk process?',
      documentIds: ['document-1'],
      messages: [],
    });

    expect(result.answer).toBe(ragConfig.fallbackAnswer);
    expect(result.trace.fallbackReason).toBe('no_relevant_sources');
    expect(result.trace.sourceGrades).toEqual([
      expect.objectContaining({
        chunkId: 'chunk-1',
        relevant: false,
        reason: 'Unable to parse source relevance grade',
      }),
      expect.objectContaining({
        chunkId: 'chunk-1',
        relevant: false,
        reason: 'Unable to parse source relevance grade',
      }),
    ]);
    expect(llmService.generateAnswer).toHaveBeenCalledTimes(4);
  });

  it('falls back when generated answers fail grounding validation', async () => {
    const source = createChunk();
    embeddingsService.embedQuery.mockResolvedValue(Array(768).fill(0.1));
    qdrantService.searchByDocumentIds.mockResolvedValue([source]);
    llmService.generateAnswer
      .mockResolvedValueOnce('{"route":"document"}')
      .mockResolvedValueOnce(
        '{"grades":[{"chunkId":"chunk-1","relevant":true}]}',
      )
      .mockResolvedValueOnce('The document says unsupported extra facts.')
      .mockResolvedValueOnce('{"grounded":false,"useful":true}')
      .mockResolvedValueOnce('Another unsupported answer.')
      .mockResolvedValueOnce('{"grounded":false,"useful":true}');

    const result = await service.generateAnswer({
      question: 'What does the document say?',
      documentIds: ['document-1'],
      messages: [],
    });

    expect(result.answer).toBe(ragConfig.fallbackAnswer);
    expect(result.sources).toEqual([source]);
    expect(result.trace.fallbackReason).toBe('ungrounded_answer');
    expect(result.trace.answerCheck).toEqual({
      grounded: false,
      useful: true,
    });
    expect(llmService.generateAnswer).toHaveBeenCalledTimes(6);
  });
});
