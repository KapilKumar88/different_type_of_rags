import { Module } from '@nestjs/common';
import { QdrantModule } from '../qdrant/qdrant.module';
import { HybridRetrieverService } from './hybrid-retriever.service';
import { SparseVectorizerService } from './sparse-vectorizer.service';

@Module({
  imports: [QdrantModule],
  providers: [SparseVectorizerService, HybridRetrieverService],
  exports: [SparseVectorizerService, HybridRetrieverService],
})
export class RagRetrievalModule {}
