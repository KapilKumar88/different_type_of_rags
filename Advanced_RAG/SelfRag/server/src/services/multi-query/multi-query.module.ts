import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { MultiQueryService } from './multi-query.service';

@Module({
  imports: [LlmModule],
  providers: [MultiQueryService],
  exports: [MultiQueryService],
})
export class MultiQueryModule {}
