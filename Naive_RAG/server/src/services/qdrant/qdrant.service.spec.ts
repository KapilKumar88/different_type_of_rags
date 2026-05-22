import { QdrantService } from './qdrant.service';

describe('QdrantService', () => {
  it('returns no chunks without calling Qdrant when no document ids are selected', async () => {
    const service = new QdrantService();
    const ensureCollection = jest.spyOn(service, 'ensureCollection');

    const result = await service.searchByDocumentIds(
      Array(768).fill(0.1),
      5,
      [],
    );

    expect(result).toEqual([]);
    expect(ensureCollection).not.toHaveBeenCalled();
  });

  it('passes selected document ids as a Qdrant filter and drops out-of-scope chunks', async () => {
    const service = new QdrantService();
    jest.spyOn(service, 'ensureCollection').mockResolvedValue(undefined);
    const search = jest.fn().mockResolvedValue([
      {
        score: 0.91,
        payload: {
          chunkId: 'chunk-1',
          documentId: 'document-1',
          fileName: 'one.txt',
          text: 'Allowed text',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      },
      {
        score: 0.88,
        payload: {
          chunkId: 'chunk-2',
          documentId: 'document-3',
          fileName: 'three.txt',
          text: 'Out of scope text',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      },
    ]);

    (
      service as unknown as {
        client: { search: typeof search };
      }
    ).client = { search };

    const result = await service.searchByDocumentIds(Array(768).fill(0.1), 5, [
      'document-1',
      'document-2',
    ]);

    expect(search).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        vector: Array(768).fill(0.1),
        limit: 5,
        filter: {
          must: [
            {
              key: 'documentId',
              match: { any: ['document-1', 'document-2'] },
            },
          ],
        },
        with_payload: true,
        with_vector: false,
      }),
    );
    expect(result).toEqual([
      {
        chunkId: 'chunk-1',
        documentId: 'document-1',
        fileName: 'one.txt',
        text: 'Allowed text',
        createdAt: '2026-01-01T00:00:00.000Z',
        score: 0.91,
      },
    ]);
  });
});
