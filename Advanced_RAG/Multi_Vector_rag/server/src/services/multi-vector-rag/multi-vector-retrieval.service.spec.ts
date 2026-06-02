import { ragConfig } from '../../config/rag.config';
import type { RetrievedChunk } from '../../types/rag.types';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { RagConcurrencyLimiterService } from '../rag-runtime/rag-concurrency-limiter.service';
import { MultiVectorRetrievalService } from './multi-vector-retrieval.service';

function createSource(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    chunkId: 'chunk-1',
    documentId: 'document-1',
    fileName: 'rag.txt',
    text: 'Parent chunk text.',
    createdAt: '2026-01-01T00:00:00.000Z',
    score: 0.7,
    bestMatchType: 'original',
    matches: [
      {
        vectorId: 'vector-original',
        vectorType: 'original',
        vectorText: 'Parent chunk text.',
        score: 0.7,
      },
    ],
    ...overrides,
  };
}

describe('MultiVectorRetrievalService', () => {
  let embeddingsService: jest.Mocked<EmbeddingsService>;
  let qdrantService: jest.Mocked<QdrantService>;
  let ragConcurrencyLimiter: jest.Mocked<RagConcurrencyLimiterService>;
  let service: MultiVectorRetrievalService;

  beforeEach(() => {
    embeddingsService = {
      embedQuery: jest.fn(),
    } as unknown as jest.Mocked<EmbeddingsService>;
    qdrantService = {
      searchByDocumentIds: jest.fn(),
    } as unknown as jest.Mocked<QdrantService>;
    ragConcurrencyLimiter = {
      run: jest.fn(async (_key, task: () => Promise<unknown>) => task()),
    } as unknown as jest.Mocked<RagConcurrencyLimiterService>;
    service = new MultiVectorRetrievalService(
      embeddingsService,
      qdrantService,
      ragConcurrencyLimiter,
    );
  });

  it('searches with an expanded limit and fuses representation hits by parent chunk', async () => {
    const questionVector = Array(768).fill(0.1);
    const originalMatch = createSource();
    const summaryMatch = createSource({
      score: 0.91,
      bestMatchType: 'summary',
      matches: [
        {
          vectorId: 'vector-summary',
          vectorType: 'summary',
          vectorText: 'Summary representation.',
          score: 0.91,
        },
      ],
    });
    const otherChunk = createSource({
      chunkId: 'chunk-2',
      score: 0.8,
      matches: [
        {
          vectorId: 'vector-question',
          vectorType: 'question',
          vectorText: 'What question is answered?',
          score: 0.8,
        },
      ],
    });
    embeddingsService.embedQuery.mockResolvedValue(questionVector);
    qdrantService.searchByDocumentIds.mockResolvedValue([
      originalMatch,
      summaryMatch,
      otherChunk,
    ]);

    const result = await service.retrieveByDocumentIds(
      'What does this say?',
      ['document-1'],
      2,
    );

    expect(qdrantService.searchByDocumentIds).toHaveBeenCalledWith(
      questionVector,
      2 * ragConfig.multiVectorSearchMultiplier,
      ['document-1'],
    );
    expect(result).toEqual([
      expect.objectContaining({
        chunkId: 'chunk-1',
        score: 0.91,
        bestMatchType: 'summary',
        matches: [
          expect.objectContaining({ vectorType: 'summary', score: 0.91 }),
          expect.objectContaining({ vectorType: 'original', score: 0.7 }),
        ],
      }),
      expect.objectContaining({
        chunkId: 'chunk-2',
        score: 0.8,
        bestMatchType: 'question',
      }),
    ]);
  });

  it('fuses legacy single-vector sources as original matches', () => {
    const result = service.fuseMatches(
      [
        {
          chunkId: 'legacy-chunk',
          documentId: 'document-1',
          fileName: 'legacy.txt',
          text: 'Legacy text.',
          createdAt: '2026-01-01T00:00:00.000Z',
          score: 0.75,
        },
      ],
      1,
    );

    expect(result).toEqual([
      expect.objectContaining({
        chunkId: 'legacy-chunk',
        score: 0.75,
        bestMatchType: 'original',
        matches: [
          {
            vectorId: 'legacy-chunk',
            vectorType: 'original',
            vectorText: 'Legacy text.',
            score: 0.75,
          },
        ],
      }),
    ]);
  });
});
