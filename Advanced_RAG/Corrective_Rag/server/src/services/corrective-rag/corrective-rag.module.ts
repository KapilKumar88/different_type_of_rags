import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { LlmModule } from '../llm/llm.module';
import { MultiQueryModule } from '../multi-query/multi-query.module';
import { QdrantModule } from '../qdrant/qdrant.module';
import { RagRuntimeModule } from '../rag-runtime/rag-runtime.module';
import { WebSearchModule } from '../web-search/web-search.module';
import { CorrectiveRagEvaluatorService } from './corrective-rag-evaluator.service';
import { CorrectiveRagService } from './corrective-rag.service';

@Module({
  imports: [
    EmbeddingsModule,
    LlmModule,
    MultiQueryModule,
    QdrantModule,
    RagRuntimeModule,
    WebSearchModule,
  ],
  providers: [CorrectiveRagService, CorrectiveRagEvaluatorService],
  exports: [CorrectiveRagService],
})
export class CorrectiveRagModule {}
