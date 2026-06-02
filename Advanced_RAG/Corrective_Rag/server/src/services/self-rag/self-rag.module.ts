import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { LlmModule } from '../llm/llm.module';
import { MultiQueryModule } from '../multi-query/multi-query.module';
import { QdrantModule } from '../qdrant/qdrant.module';
import { RagRuntimeModule } from '../rag-runtime/rag-runtime.module';
import { SelfRagEvaluatorService } from './self-rag-evaluator.service';
import { SelfRagService } from './self-rag.service';

@Module({
  imports: [
    EmbeddingsModule,
    LlmModule,
    MultiQueryModule,
    QdrantModule,
    RagRuntimeModule,
  ],
  providers: [SelfRagService, SelfRagEvaluatorService],
  exports: [SelfRagService],
})
export class SelfRagModule {}
