import { Module } from '@nestjs/common';
import { RagConcurrencyLimiterService } from './rag-concurrency-limiter.service';

@Module({
  providers: [RagConcurrencyLimiterService],
  exports: [RagConcurrencyLimiterService],
})
export class RagRuntimeModule {}
