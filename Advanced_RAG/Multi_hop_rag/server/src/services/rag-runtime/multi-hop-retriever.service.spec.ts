import { ragConfig } from '../../config/rag.config';
import type { RetrievedChunk } from '../../types/rag.types';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { LlmService } from '../llm/llm.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { RagConcurrencyLimiterService } from './rag-concurrency-limiter.service';
import { MultiHopRetrieverService } from './multi-hop-retriever.service';

function createChunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    chunkId: 'chunk-1',
    documentId: 'doc-1',
    fileName: 'test.txt',
    text: 'Sample retrieved text for multi-hop testing.',
    createdAt: '2026-01-01T00:00:00.000Z',
    score: 0.85,
    ...overrides,
  };
}

describe('MultiHopRetrieverService', () => {
  let embeddingsService: jest.Mocked<EmbeddingsService>;
  let qdrantService: jest.Mocked<QdrantService>;
  let llmService: jest.Mocked<LlmService>;
  let ragConcurrencyLimiter: jest.Mocked<RagConcurrencyLimiterService>;
  let service: MultiHopRetrieverService;

  const dummyVector = Array(768).fill(0.1);
  const documentIds = ['doc-1'];

  beforeEach(() => {
    embeddingsService = {
      embedQuery: jest.fn().mockResolvedValue(dummyVector),
    } as unknown as jest.Mocked<EmbeddingsService>;

    qdrantService = {
      searchByDocumentIds: jest.fn(),
    } as unknown as jest.Mocked<QdrantService>;

    llmService = {
      generateAnswer: jest.fn(),
    } as unknown as jest.Mocked<LlmService>;

    ragConcurrencyLimiter = {
      run: jest.fn(async (_key: string, task: () => Promise<unknown>) =>
        task(),
      ),
    } as unknown as jest.Mocked<RagConcurrencyLimiterService>;

    service = new MultiHopRetrieverService(
      embeddingsService,
      qdrantService,
      llmService,
      ragConcurrencyLimiter,
    );
  });

  it('falls back to the original question when decomposition returns invalid JSON', async () => {
    llmService.generateAnswer
      .mockResolvedValueOnce('not valid json at all')
      .mockResolvedValue('DONE');

    const chunk = createChunk({ chunkId: 'c1' });
    qdrantService.searchByDocumentIds.mockResolvedValue([chunk]);

    const result = await service.retrieve('What is multi-hop RAG?', documentIds);

    expect(result.hops).toHaveLength(1);
    expect(result.hops[0].kind).toBe('sub-question');
    expect(result.hops[0].query).toBe('What is multi-hop RAG?');
    expect(result.sources).toHaveLength(1);
  });

  it('deduplicates chunks by chunkId across hops', async () => {
    llmService.generateAnswer
      .mockResolvedValueOnce('["sub-q-1"]')
      .mockResolvedValueOnce('follow-up-1')
      .mockResolvedValue('DONE');

    const chunk1 = createChunk({ chunkId: 'c1', score: 0.9 });
    const chunk2 = createChunk({ chunkId: 'c2', score: 0.8 });
    const chunk3 = createChunk({ chunkId: 'c3', score: 0.7 });

    qdrantService.searchByDocumentIds
      .mockResolvedValueOnce([chunk1, chunk2])
      .mockResolvedValueOnce([chunk2, chunk3]);

    const result = await service.retrieve('Explain A and B.', documentIds);

    expect(result.hops).toHaveLength(2);
    expect(result.hops[0].newChunkCount).toBe(2);
    expect(result.hops[1].newChunkCount).toBe(1);
    expect(result.sources).toHaveLength(3);
    const chunkIds = result.sources.map((s) => s.chunkId);
    expect(chunkIds).toContain('c1');
    expect(chunkIds).toContain('c2');
    expect(chunkIds).toContain('c3');
  });

  it('stops after maxHops iterations even when follow-ups keep arriving', async () => {
    llmService.generateAnswer
      .mockResolvedValueOnce('["sub-q"]')
      .mockResolvedValueOnce('follow-up-1')
      .mockResolvedValueOnce('follow-up-2')
      .mockResolvedValueOnce('follow-up-3');

    qdrantService.searchByDocumentIds
      .mockResolvedValueOnce([createChunk({ chunkId: 'c1' })])
      .mockResolvedValueOnce([createChunk({ chunkId: 'c2' })])
      .mockResolvedValueOnce([createChunk({ chunkId: 'c3' })])
      .mockResolvedValueOnce([createChunk({ chunkId: 'c4' })]);

    const result = await service.retrieve('Bridge question?', documentIds);

    expect(result.hops).toHaveLength(ragConfig.multiHop.maxHops);
  });

  it('stops early when the LLM returns DONE for follow-up', async () => {
    llmService.generateAnswer
      .mockResolvedValueOnce('["sub-q"]')
      .mockResolvedValueOnce('DONE');

    qdrantService.searchByDocumentIds.mockResolvedValueOnce([
      createChunk({ chunkId: 'c1' }),
    ]);

    const result = await service.retrieve('Simple question?', documentIds);

    expect(result.hops).toHaveLength(1);
    expect(result.sources).toHaveLength(1);
  });

  it('stops early when a hop returns no new chunks', async () => {
    const chunk = createChunk({ chunkId: 'c1' });

    llmService.generateAnswer
      .mockResolvedValueOnce('["sub-q"]')
      .mockResolvedValueOnce('follow-up-exhausted');

    qdrantService.searchByDocumentIds
      .mockResolvedValueOnce([chunk])
      .mockResolvedValueOnce([chunk]);

    const result = await service.retrieve('Exhausted question?', documentIds);

    expect(result.hops).toHaveLength(2);
    expect(result.hops[1].newChunkCount).toBe(0);
    expect(result.sources).toHaveLength(1);
  });

  it('caps final sources at maxContextChunks when accumulation exceeds the limit', async () => {
    llmService.generateAnswer
      .mockResolvedValueOnce('["sq1","sq2","sq3"]')
      .mockResolvedValue('DONE');

    const makeChunks = (prefix: string): RetrievedChunk[] =>
      Array.from({ length: 4 }, (_, i) =>
        createChunk({ chunkId: `${prefix}-${i + 1}`, score: 0.8 - i * 0.1 }),
      );

    qdrantService.searchByDocumentIds
      .mockResolvedValueOnce(makeChunks('h1'))
      .mockResolvedValueOnce(makeChunks('h2'))
      .mockResolvedValueOnce(makeChunks('h3'));

    const result = await service.retrieve('Wide question?', documentIds);

    expect(result.hops).toHaveLength(3);
    expect(result.sources).toHaveLength(ragConfig.multiHop.maxContextChunks);
  });
});
