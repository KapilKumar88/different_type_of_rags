import { QdrantService } from './qdrant.service';

describe('QdrantService', () => {
  it('creates new collections with dense and sparse vector configuration plus document index', async () => {
    const service = new QdrantService();
    const collectionExists = jest.fn().mockResolvedValue({ exists: false });
    const createCollection = jest.fn().mockResolvedValue(true);
    const createPayloadIndex = jest.fn().mockResolvedValue({});

    (
      service as unknown as {
        client: {
          collectionExists: typeof collectionExists;
          createCollection: typeof createCollection;
          createPayloadIndex: typeof createPayloadIndex;
        };
      }
    ).client = {
      collectionExists,
      createCollection,
      createPayloadIndex,
    };

    await service.ensureCollection();

    expect(createCollection).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        vectors: {
          size: 768,
          distance: 'Cosine',
        },
        sparse_vectors: {
          text_sparse: {
            modifier: 'idf',
          },
        },
      }),
    );
    expect(createPayloadIndex).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        field_name: 'documentId',
        field_schema: 'keyword',
      }),
    );
  });

  it('adds missing sparse vector and document id index to existing collections', async () => {
    const service = new QdrantService();
    const collectionExists = jest.fn().mockResolvedValue({ exists: true });
    const getCollection = jest.fn().mockResolvedValue({
      config: {
        params: {
          sparse_vectors: null,
        },
      },
      payload_schema: {},
    });
    const createVectorName = jest.fn().mockResolvedValue(true);
    const createPayloadIndex = jest.fn().mockResolvedValue({});

    (
      service as unknown as {
        client: {
          collectionExists: typeof collectionExists;
          getCollection: typeof getCollection;
          createVectorName: typeof createVectorName;
          createPayloadIndex: typeof createPayloadIndex;
        };
      }
    ).client = {
      collectionExists,
      getCollection,
      createVectorName,
      createPayloadIndex,
    };

    await service.ensureCollection();

    expect(createVectorName).toHaveBeenCalledWith(
      expect.any(String),
      'text_sparse',
      {
        sparse: {
          modifier: 'idf',
        },
      },
      { wait: true },
    );
    expect(createPayloadIndex).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        field_name: 'documentId',
        field_schema: 'keyword',
      }),
    );
  });

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

  it('updates named sparse vectors for existing dense points', async () => {
    const service = new QdrantService();
    jest.spyOn(service, 'ensureCollection').mockResolvedValue(undefined);
    const updateVectors = jest.fn().mockResolvedValue({});

    (
      service as unknown as {
        client: { updateVectors: typeof updateVectors };
      }
    ).client = { updateVectors };

    await service.updateSparseVectors([
      {
        id: 'chunk-1',
        sparseVector: {
          indices: [11, 29],
          values: [1, 0.5],
        },
      },
    ]);

    expect(updateVectors).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        wait: true,
        points: [
          {
            id: 'chunk-1',
            vector: {
              text_sparse: {
                indices: [11, 29],
                values: [1, 0.5],
              },
            },
          },
        ],
      }),
    );
  });

  it('searches sparse vectors inside selected document scope', async () => {
    const service = new QdrantService();
    jest.spyOn(service, 'ensureCollection').mockResolvedValue(undefined);
    const search = jest.fn().mockResolvedValue([
      {
        score: 0.77,
        payload: {
          chunkId: 'chunk-1',
          documentId: 'document-1',
          fileName: 'one.txt',
          text: 'Allowed keyword text',
          createdAt: '2026-01-01T00:00:00.000Z',
          sparseIndexed: true,
        },
      },
    ]);

    (
      service as unknown as {
        client: { search: typeof search };
      }
    ).client = { search };

    const result = await service.searchSparseByDocumentIds(
      { indices: [42], values: [1] },
      5,
      ['document-1'],
    );

    expect(search).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        vector: {
          name: 'text_sparse',
          vector: {
            indices: [42],
            values: [1],
          },
        },
        filter: {
          must: [
            {
              key: 'documentId',
              match: { any: ['document-1'] },
            },
          ],
        },
      }),
    );
    expect(result).toEqual([
      {
        chunkId: 'chunk-1',
        documentId: 'document-1',
        fileName: 'one.txt',
        text: 'Allowed keyword text',
        createdAt: '2026-01-01T00:00:00.000Z',
        sparseIndexed: true,
        score: 0.77,
      },
    ]);
  });
});
