import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../../../services/embeddings/embeddings.module';
import { QdrantModule } from '../../../services/qdrant/qdrant.module';
import { RagRetrievalModule } from '../../../services/rag-retrieval/rag-retrieval.module';
import { RagRuntimeModule } from '../../../services/rag-runtime/rag-runtime.module';
import { DocumentsController } from './documents.controller';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';
import { DocumentParsingModule } from '../../../services/parsing/document-parsing.module';
import { DocumentUploadValidationPipe } from './pipes/document-upload-validation.pipe';

@Module({
  imports: [
    EmbeddingsModule,
    QdrantModule,
    RagRetrievalModule,
    DocumentParsingModule,
    RagRuntimeModule,
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentsRepository,
    DocumentUploadValidationPipe,
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
