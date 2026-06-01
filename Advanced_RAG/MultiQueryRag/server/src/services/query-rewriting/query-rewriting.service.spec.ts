import { Logger } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { QueryRewritingService } from './query-rewriting.service';

describe('QueryRewritingService', () => {
  let llmService: jest.Mocked<LlmService>;
  let service: QueryRewritingService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    llmService = {
      generateAnswer: jest.fn(),
      streamAnswer: jest.fn(),
    } as unknown as jest.Mocked<LlmService>;
    service = new QueryRewritingService(llmService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rewrites a contextual follow-up into standalone retrieval metadata', async () => {
    llmService.generateAnswer.mockResolvedValue(
      'query rewriting in retrieval augmented generation',
    );

    const result = await service.rewriteQuery({
      latestUserMessage: 'How does that improve search?',
      historyMessages: [
        {
          role: 'user',
          content: 'What is query rewriting RAG?',
        },
        {
          role: 'assistant',
          content:
            'Query rewriting RAG reformulates user questions before retrieval.',
        },
      ],
    });

    expect(llmService.generateAnswer).toHaveBeenCalledTimes(1);
    expect(llmService.generateAnswer.mock.calls[0]?.[0]).toContain(
      '<conversation_history>',
    );
    expect(llmService.generateAnswer.mock.calls[0]?.[0]).toContain(
      'User: What is query rewriting RAG?',
    );
    expect(llmService.generateAnswer.mock.calls[0]?.[0]).toContain(
      '<latest_user_message>',
    );
    expect(result).toMatchObject({
      originalQuery: 'How does that improve search?',
      rewrittenQuery: 'query rewriting in retrieval augmented generation',
      wasRewritten: true,
      strategy: 'query_rewriting',
    });
    expect(Date.parse(result.createdAt)).not.toBeNaN();
  });

  it('sanitizes markdown fences, wrapping quotes, and extra whitespace', async () => {
    llmService.generateAnswer.mockResolvedValue(
      '```text\n"document scoped vector search"\n```',
    );

    const result = await service.rewriteQuery({
      latestUserMessage: 'Search this',
      historyMessages: [],
    });

    expect(result.rewrittenQuery).toBe('document scoped vector search');
    expect(result.wasRewritten).toBe(true);
  });

  it('falls back to the original query when the model returns blank output', async () => {
    llmService.generateAnswer.mockResolvedValue('   ');

    const result = await service.rewriteQuery({
      latestUserMessage: 'What does the upload pipeline do?',
      historyMessages: [],
    });

    expect(result).toMatchObject({
      originalQuery: 'What does the upload pipeline do?',
      rewrittenQuery: 'What does the upload pipeline do?',
      wasRewritten: false,
      strategy: 'query_rewriting',
    });
  });

  it('falls back to the original query when the model throws', async () => {
    llmService.generateAnswer.mockRejectedValue(
      new Error('Ollama unavailable'),
    );

    const result = await service.rewriteQuery({
      latestUserMessage: 'Explain ingestion.',
      historyMessages: [],
    });

    expect(result).toMatchObject({
      originalQuery: 'Explain ingestion.',
      rewrittenQuery: 'Explain ingestion.',
      wasRewritten: false,
      strategy: 'query_rewriting',
    });
  });

  it('falls back to the original query when rewritten output is too long', async () => {
    llmService.generateAnswer.mockResolvedValue('x'.repeat(501));

    const result = await service.rewriteQuery({
      latestUserMessage: 'Short query',
      historyMessages: [],
    });

    expect(result).toMatchObject({
      originalQuery: 'Short query',
      rewrittenQuery: 'Short query',
      wasRewritten: false,
      strategy: 'query_rewriting',
    });
  });
});
