import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { RagRuntimeModule } from '../rag-runtime/rag-runtime.module';
import { GraphExtractionService } from './graph-extraction.service';

@Module({
  imports: [LlmModule, RagRuntimeModule],
  providers: [GraphExtractionService],
  exports: [GraphExtractionService],
})
export class GraphExtractionModule {}
