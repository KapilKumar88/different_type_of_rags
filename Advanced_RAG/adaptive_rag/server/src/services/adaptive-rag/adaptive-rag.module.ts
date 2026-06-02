import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { LlmModule } from '../llm/llm.module';
import { QdrantModule } from '../qdrant/qdrant.module';
import { RagRuntimeModule } from '../rag-runtime/rag-runtime.module';
import { AdaptiveRagService } from './adaptive-rag.service';

@Module({
  imports: [EmbeddingsModule, LlmModule, QdrantModule, RagRuntimeModule],
  providers: [AdaptiveRagService],
  exports: [AdaptiveRagService],
})
export class AdaptiveRagModule {}
