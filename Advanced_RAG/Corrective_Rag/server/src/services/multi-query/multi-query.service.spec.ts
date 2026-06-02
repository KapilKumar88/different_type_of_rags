import { Logger } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { MultiQueryService } from './multi-query.service';

describe('MultiQueryService', () => {
  let llmService: jest.Mocked<LlmService>;
  let service: MultiQueryService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    llmService = {
      generateAnswer: jest.fn(),
      streamAnswer: jest.fn(),
    } as unknown as jest.Mocked<LlmService>;
    service = new MultiQueryService(llmService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generates metadata with the original query first and alternate JSON queries', async () => {
    llmService.generateAnswer.mockResolvedValue(
      JSON.stringify([
        'document scoped vector search',
        'conversation scoped qdrant retrieval',
        'retrieval augmented generation query expansion',
      ]),
    );

    const result = await service.generateQueries({
      latestUserMessage: 'How does that improve search?',
      historyMessages: [
        {
          role: 'user',
          content: 'What is multi-query RAG?',
        },
        {
          role: 'assistant',
          content:
            'Multi-query RAG generates several retrieval queries before search.',
        },
      ],
    });

    expect(llmService.generateAnswer).toHaveBeenCalledTimes(1);
    expect(llmService.generateAnswer.mock.calls[0]?.[0]).toContain(
      '<conversation_history>',
    );
    expect(llmService.generateAnswer.mock.calls[0]?.[0]).toContain(
      'User: What is multi-query RAG?',
    );
    expect(llmService.generateAnswer.mock.calls[0]?.[0]).toContain(
      '<latest_user_message>',
    );
    expect(result).toMatchObject({
      originalQuery: 'How does that improve search?',
      generatedQueries: [
        'How does that improve search?',
        'document scoped vector search',
        'conversation scoped qdrant retrieval',
        'retrieval augmented generation query expansion',
      ],
      usedQueryCount: 4,
      strategy: 'multi_query',
    });
    expect(Date.parse(result.createdAt)).not.toBeNaN();
  });

  it('sanitizes fenced JSON, wrapping quotes, and extra whitespace', async () => {
    llmService.generateAnswer.mockResolvedValue(
      '```json\n["\\"document scoped vector search\\""]\n```',
    );

    const result = await service.generateQueries({
      latestUserMessage: 'Search this',
      historyMessages: [],
    });

    expect(result.generatedQueries).toEqual([
      'Search this',
      'document scoped vector search',
    ]);
  });

  it('uses line-separated fallback when the model omits JSON syntax', async () => {
    llmService.generateAnswer.mockResolvedValue(
      ['- document upload pipeline', '2. indexed document chunks'].join('\n'),
    );

    const result = await service.generateQueries({
      latestUserMessage: 'What does ingestion do?',
      historyMessages: [],
    });

    expect(result.generatedQueries).toEqual([
      'What does ingestion do?',
      'document upload pipeline',
      'indexed document chunks',
    ]);
  });

  it('deduplicates queries while preserving first occurrence order', async () => {
    llmService.generateAnswer.mockResolvedValue(
      JSON.stringify([
        'What is RAG?',
        'what is rag?',
        'retrieval augmented generation',
      ]),
    );

    const result = await service.generateQueries({
      latestUserMessage: 'What is RAG?',
      historyMessages: [],
    });

    expect(result.generatedQueries).toEqual([
      'What is RAG?',
      'retrieval augmented generation',
    ]);
    expect(result.usedQueryCount).toBe(2);
  });

  it('falls back to the original query when the model returns malformed JSON', async () => {
    llmService.generateAnswer.mockResolvedValue('[not valid json');

    const result = await service.generateQueries({
      latestUserMessage: 'Explain ingestion.',
      historyMessages: [],
    });

    expect(result).toMatchObject({
      originalQuery: 'Explain ingestion.',
      generatedQueries: ['Explain ingestion.'],
      usedQueryCount: 1,
      strategy: 'multi_query',
    });
  });

  it('falls back to the original query when the model returns blank output', async () => {
    llmService.generateAnswer.mockResolvedValue('   ');

    const result = await service.generateQueries({
      latestUserMessage: 'What does the upload pipeline do?',
      historyMessages: [],
    });

    expect(result.generatedQueries).toEqual([
      'What does the upload pipeline do?',
    ]);
    expect(result.usedQueryCount).toBe(1);
  });

  it('filters overlong generated queries without losing usable queries', async () => {
    llmService.generateAnswer.mockResolvedValue(
      JSON.stringify(['x'.repeat(501), 'valid alternate query']),
    );

    const result = await service.generateQueries({
      latestUserMessage: 'Short query',
      historyMessages: [],
    });

    expect(result.generatedQueries).toEqual([
      'Short query',
      'valid alternate query',
    ]);
  });

  it('falls back to the original query when the model throws', async () => {
    llmService.generateAnswer.mockRejectedValue(
      new Error('Ollama unavailable'),
    );

    const result = await service.generateQueries({
      latestUserMessage: 'Explain retrieval.',
      historyMessages: [],
    });

    expect(result).toMatchObject({
      originalQuery: 'Explain retrieval.',
      generatedQueries: ['Explain retrieval.'],
      usedQueryCount: 1,
      strategy: 'multi_query',
    });
  });
});
