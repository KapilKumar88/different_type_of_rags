import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { QueryRewritingService } from './query-rewriting.service';

@Module({
  imports: [LlmModule],
  providers: [QueryRewritingService],
  exports: [QueryRewritingService],
})
export class QueryRewritingModule {}
