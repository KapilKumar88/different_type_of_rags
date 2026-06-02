import { HttpException, HttpStatus } from '@nestjs/common';
import { ragRateLimitConfig } from '../../config/rag-rate-limit.config';
import { RagConcurrencyLimiterService } from './rag-concurrency-limiter.service';

function createDeferred(): {
  promise: Promise<void>;
  resolve: () => void;
} {
  let resolvePromise: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise,
  };
}

describe('RagConcurrencyLimiterService', () => {
  let service: RagConcurrencyLimiterService;

  beforeEach(() => {
    service = new RagConcurrencyLimiterService();
  });

  it('rejects operations beyond the configured concurrency limit', async () => {
    const deferred = createDeferred();
    const runningTasks = Array.from(
      { length: ragRateLimitConfig.runtime.concurrencyLimit },
      () => service.run('embedding', () => deferred.promise),
    );

    expect(service.getActiveCount('embedding')).toBe(
      ragRateLimitConfig.runtime.concurrencyLimit,
    );
    await expect(
      service.run('embedding', async () => 'blocked'),
    ).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    } satisfies Partial<HttpException>);

    deferred.resolve();
    await Promise.all(runningTasks);
    expect(service.getActiveCount('embedding')).toBe(0);
  });

  it('releases concurrency slots when tasks fail', async () => {
    await expect(
      service.run('qdrant-search', async () => {
        throw new Error('search failed');
      }),
    ).rejects.toThrow('search failed');

    expect(service.getActiveCount('qdrant-search')).toBe(0);
  });

  it('releases stream concurrency slots after streaming', async () => {
    async function* stream() {
      yield 'one';
      yield 'two';
    }

    const tokens: string[] = [];

    for await (const token of service.runStream('llm-stream', stream)) {
      tokens.push(token);
    }

    expect(tokens).toEqual(['one', 'two']);
    expect(service.getActiveCount('llm-stream')).toBe(0);
  });
});
