import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ragRateLimitConfig } from '../../config/rag-rate-limit.config';

@Injectable()
export class RagConcurrencyLimiterService {
  private readonly activeCounts = new Map<string, number>();

  async run<T>(key: string, task: () => Promise<T>): Promise<T> {
    this.acquire(key);

    try {
      return await task();
    } finally {
      this.release(key);
    }
  }

  async *runStream<T>(
    key: string,
    task: () => AsyncGenerator<T>,
  ): AsyncGenerator<T> {
    this.acquire(key);

    try {
      for await (const item of task()) {
        yield item;
      }
    } finally {
      this.release(key);
    }
  }

  getActiveCount(key: string): number {
    return this.activeCounts.get(key) ?? 0;
  }

  private acquire(key: string): void {
    const activeCount = this.getActiveCount(key);

    if (activeCount >= ragRateLimitConfig.runtime.concurrencyLimit) {
      throw new HttpException(
        'Too many RAG operations are already running',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.activeCounts.set(key, activeCount + 1);
  }

  private release(key: string): void {
    const activeCount = this.getActiveCount(key);

    if (activeCount <= 1) {
      this.activeCounts.delete(key);
      return;
    }

    this.activeCounts.set(key, activeCount - 1);
  }
}
