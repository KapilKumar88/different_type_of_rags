import { Logger } from '@nestjs/common';
import { webSearchConfig } from '../../config/web-search.config';
import { TavilyWebSearchService } from './tavily-web-search.service';

jest.mock('../../config/web-search.config', () => ({
  webSearchConfig: {
    tavilyApiKey: 'test-tavily-key',
    tavilyBaseUrl: 'https://api.tavily.com',
    maxResults: 2,
    timeoutMs: 1000,
  },
}));

type MutableWebSearchConfig = {
  tavilyApiKey?: string;
  tavilyBaseUrl: string;
  maxResults: number;
  timeoutMs: number;
};

describe('TavilyWebSearchService', () => {
  let service: TavilyWebSearchService;
  let fetchMock: jest.MockedFunction<typeof fetch>;
  const originalFetch = global.fetch;
  const mutableWebSearchConfig =
    webSearchConfig as MutableWebSearchConfig;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;
    mutableWebSearchConfig.tavilyApiKey = 'test-tavily-key';
    mutableWebSearchConfig.tavilyBaseUrl = 'https://api.tavily.com';
    mutableWebSearchConfig.maxResults = 2;
    mutableWebSearchConfig.timeoutMs = 1000;
    service = new TavilyWebSearchService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('normalizes Tavily results into bounded web sources', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              title: 'Corrective RAG',
              url: 'https://example.com/crag',
              content: 'Corrective RAG uses a retrieval evaluator.',
              score: 0.92,
            },
            {
              title: 'Ignored extra',
              url: 'https://example.com/extra',
              content: 'Extra result.',
              score: 0.5,
            },
            {
              title: 'Over limit',
              url: 'https://example.com/over',
              content: 'Should be removed by maxResults.',
              score: 0.4,
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await service.search({ query: '  corrective rag  ' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.tavily.com/search',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-tavily-key',
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(result.status).toBe('searched');
    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toMatchObject({
      sourceType: 'web',
      title: 'Corrective RAG',
      url: 'https://example.com/crag',
      content: 'Corrective RAG uses a retrieval evaluator.',
      score: 0.92,
      provider: 'tavily',
    });
  });

  it('returns disabled when Tavily API key is not configured', async () => {
    mutableWebSearchConfig.tavilyApiKey = undefined;

    const result = await service.search({ query: 'corrective rag' });

    expect(result).toMatchObject({
      status: 'disabled',
      query: 'corrective rag',
      results: [],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns no_results when provider payload has no usable results', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [{ title: 'Missing URL', content: 'No URL.' }],
        }),
        { status: 200 },
      ),
    );

    const result = await service.search({ query: 'corrective rag' });

    expect(result).toMatchObject({
      status: 'no_results',
      results: [],
    });
  });

  it('returns failed without leaking provider details', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'secret provider message' }), {
        status: 500,
      }),
    );

    const result = await service.search({ query: 'corrective rag' });

    expect(result).toMatchObject({
      status: 'failed',
      results: [],
      reason: 'Tavily search failed.',
    });
    expect(JSON.stringify(result)).not.toContain('secret provider message');
  });
});
