import { EmbeddingsService } from '../embeddings/embeddings.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { RagConcurrencyLimiterService } from '../rag-runtime/rag-concurrency-limiter.service';
import { MultiVectorIndexingService } from './multi-vector-indexing.service';
import { MultiVectorRepresentationService } from './multi-vector-representation.service';

describe('MultiVectorIndexingService', () => {
  let representationService: jest.Mocked<MultiVectorRepresentationService>;
  let embeddingsService: jest.Mocked<EmbeddingsService>;
  let qdrantService: jest.Mocked<QdrantService>;
  let ragConcurrencyLimiter: jest.Mocked<RagConcurrencyLimiterService>;
  let service: MultiVectorIndexingService;

  beforeEach(() => {
    representationService = {
      generateRepresentations: jest.fn(),
    } as unknown as jest.Mocked<MultiVectorRepresentationService>;
    embeddingsService = {
      embedDocuments: jest.fn(),
    } as unknown as jest.Mocked<EmbeddingsService>;
    qdrantService = {
      upsertPoints: jest.fn(),
    } as unknown as jest.Mocked<QdrantService>;
    ragConcurrencyLimiter = {
      run: jest.fn(async (_key, task: () => Promise<unknown>) => task()),
    } as unknown as jest.Mocked<RagConcurrencyLimiterService>;
    service = new MultiVectorIndexingService(
      representationService,
      embeddingsService,
      qdrantService,
      ragConcurrencyLimiter,
    );
  });

  it('indexes original, summary, and question vectors for each parent chunk', async () => {
    representationService.generateRepresentations.mockResolvedValue([
      {
        chunkIndex: 0,
        summary: 'Summary representation.',
        questions: ['Question one?', 'Question two?', 'Question three?'],
      },
    ]);
    embeddingsService.embedDocuments.mockResolvedValue([
      Array(768).fill(0.1),
      Array(768).fill(0.2),
      Array(768).fill(0.3),
      Array(768).fill(0.4),
      Array(768).fill(0.5),
    ]);

    await service.indexDocument({
      documentId: 'document-1',
      fileName: 'rag.txt',
      createdAt: '2026-01-01T00:00:00.000Z',
      chunks: [{ text: 'Parent chunk text.', pageNumber: 2 }],
    });

    expect(embeddingsService.embedDocuments).toHaveBeenCalledWith([
      'Parent chunk text.',
      'Summary representation.',
      'Question one?',
      'Question two?',
      'Question three?',
    ]);
    const points = qdrantService.upsertPoints.mock.calls[0]?.[0] ?? [];
    const chunkIds = new Set(points.map((point) => point.payload.chunkId));

    expect(points).toHaveLength(5);
    expect(chunkIds.size).toBe(1);
    expect(points.map((point) => point.payload.vectorType)).toEqual([
      'original',
      'summary',
      'question',
      'question',
      'question',
    ]);
    expect(points[0]?.payload).toEqual(
      expect.objectContaining({
        documentId: 'document-1',
        fileName: 'rag.txt',
        text: 'Parent chunk text.',
        vectorText: 'Parent chunk text.',
        pageNumber: 2,
      }),
    );
  });
});
