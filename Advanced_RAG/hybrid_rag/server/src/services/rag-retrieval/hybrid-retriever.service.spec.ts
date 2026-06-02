import type { RetrievedChunk } from '../../types/rag.types';
import { QdrantService } from '../qdrant/qdrant.service';
import { HybridRetrieverService } from './hybrid-retriever.service';
import { SparseVectorizerService } from './sparse-vectorizer.service';

function createChunk(
  chunkId: string,
  score: number,
  overrides: Partial<RetrievedChunk> = {},
): RetrievedChunk {
  return {
    chunkId,
    documentId: overrides.documentId ?? 'document-1',
    fileName: overrides.fileName ?? 'notes.txt',
    text: overrides.text ?? `Text for ${chunkId}`,
    createdAt: '2026-01-01T00:00:00.000Z',
    score,
    ...overrides,
  };
}

describe('HybridRetrieverService', () => {
  let qdrantService: jest.Mocked<QdrantService>;
  let sparseVectorizerService: jest.Mocked<SparseVectorizerService>;
  let service: HybridRetrieverService;

  beforeEach(() => {
    qdrantService = {
      searchDenseByDocumentIds: jest.fn(),
      searchSparseByDocumentIds: jest.fn(),
    } as unknown as jest.Mocked<QdrantService>;
    sparseVectorizerService = {
      vectorize: jest.fn(() => ({ indices: [7], values: [1] })),
    } as unknown as jest.Mocked<SparseVectorizerService>;
    service = new HybridRetrieverService(qdrantService, sparseVectorizerService);
  });

  it('runs dense and sparse searches inside selected document scope', async () => {
    const denseVector = Array(768).fill(0.2);
    qdrantService.searchDenseByDocumentIds.mockResolvedValue([
      createChunk('dense-only', 0.91),
    ]);
    qdrantService.searchSparseByDocumentIds.mockResolvedValue([
      createChunk('sparse-only', 0.7),
    ]);

    const result = await service.retrieveByDocumentIds({
      denseVector,
      query: 'invoice status',
      documentIds: ['document-1', 'document-2'],
      limit: 5,
    });

    expect(sparseVectorizerService.vectorize).toHaveBeenCalledWith(
      'invoice status',
    );
    expect(qdrantService.searchDenseByDocumentIds).toHaveBeenCalledWith(
      denseVector,
      20,
      ['document-1', 'document-2'],
    );
    expect(qdrantService.searchSparseByDocumentIds).toHaveBeenCalledWith(
      { indices: [7], values: [1] },
      20,
      ['document-1', 'document-2'],
    );
    expect(result.map((chunk) => chunk.retrievalMode)).toEqual([
      'dense',
      'sparse',
    ]);
  });

  it('fuses dense-only, sparse-only, and hybrid candidates with diagnostics', () => {
    const denseResults = [
      createChunk('shared', 0.9),
      createChunk('dense-only', 0.8),
    ];
    const sparseResults = [
      createChunk('shared', 0.7),
      createChunk('sparse-only', 0.6),
    ];

    const result = service.fuseResults(denseResults, sparseResults);
    const shared = result.find((chunk) => chunk.chunkId === 'shared');
    const denseOnly = result.find((chunk) => chunk.chunkId === 'dense-only');
    const sparseOnly = result.find((chunk) => chunk.chunkId === 'sparse-only');

    expect(shared).toEqual(
      expect.objectContaining({
        retrievalMode: 'hybrid',
        denseScore: 0.9,
        sparseScore: 0.7,
        denseRank: 1,
        sparseRank: 1,
      }),
    );
    expect(denseOnly).toEqual(
      expect.objectContaining({
        retrievalMode: 'dense',
        denseScore: 0.8,
        denseRank: 2,
      }),
    );
    expect(sparseOnly).toEqual(
      expect.objectContaining({
        retrievalMode: 'sparse',
        sparseScore: 0.6,
        sparseRank: 2,
      }),
    );
    expect(result[0]?.chunkId).toBe('shared');
  });

  it('returns no results without selected document ids', async () => {
    const result = await service.retrieveByDocumentIds({
      denseVector: Array(768).fill(0.2),
      query: 'invoice status',
      documentIds: [],
      limit: 5,
    });

    expect(result).toEqual([]);
    expect(qdrantService.searchDenseByDocumentIds).not.toHaveBeenCalled();
    expect(qdrantService.searchSparseByDocumentIds).not.toHaveBeenCalled();
  });
});
