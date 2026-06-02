import { SparseVectorizerService } from './sparse-vectorizer.service';

describe('SparseVectorizerService', () => {
  let service: SparseVectorizerService;

  beforeEach(() => {
    service = new SparseVectorizerService();
  });

  it('creates deterministic sparse vectors for the same text', () => {
    const first = service.vectorize('Hybrid RAG retrieves invoiceStatus values.');
    const second = service.vectorize('Hybrid RAG retrieves invoiceStatus values.');

    expect(first).toEqual(second);
    expect(first.indices.length).toBeGreaterThan(0);
    expect(first.indices.length).toBe(first.values.length);
  });

  it('tokenizes natural text and code-style identifiers', () => {
    const tokens = service.tokenize('invoiceStatus HTTPServer user_id');

    expect(tokens).toEqual(
      expect.arrayContaining([
        'invoicestatus',
        'invoice',
        'status',
        'httpserver',
        'http',
        'server',
        'user_id',
        'user',
        'id',
      ]),
    );
  });

  it('caps sparse features using the configured maximum', () => {
    const text = Array.from({ length: 400 }, (_, index) => `token${index}`).join(
      ' ',
    );
    const vector = service.vectorize(text);

    expect(vector.indices.length).toBeLessThanOrEqual(256);
    expect(vector.values.length).toBe(vector.indices.length);
  });

  it('returns an empty sparse vector for text without usable tokens', () => {
    expect(service.vectorize(' . , ! a ')).toEqual({
      indices: [],
      values: [],
    });
  });
});
