import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { LlmModule } from '../llm/llm.module';
import { QdrantModule } from '../qdrant/qdrant.module';
import { RagRuntimeModule } from '../rag-runtime/rag-runtime.module';
import { MultiVectorIndexingService } from './multi-vector-indexing.service';
import { MultiVectorRepresentationService } from './multi-vector-representation.service';
import { MultiVectorRetrievalService } from './multi-vector-retrieval.service';

@Module({
  imports: [EmbeddingsModule, LlmModule, QdrantModule, RagRuntimeModule],
  providers: [
    MultiVectorIndexingService,
    MultiVectorRepresentationService,
    MultiVectorRetrievalService,
  ],
  exports: [MultiVectorIndexingService, MultiVectorRetrievalService],
})
export class MultiVectorRagModule {}
