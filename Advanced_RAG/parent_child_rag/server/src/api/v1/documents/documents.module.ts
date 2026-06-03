import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../../../services/embeddings/embeddings.module';
import { QdrantModule } from '../../../services/qdrant/qdrant.module';
import { RagRuntimeModule } from '../../../services/rag-runtime/rag-runtime.module';
import { DocumentsController } from './documents.controller';
import { DocumentParentsRepository } from './document-parents.repository';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';
import { DocumentParsingModule } from '../../../services/parsing/document-parsing.module';
import { DocumentUploadValidationPipe } from './pipes/document-upload-validation.pipe';

@Module({
  imports: [
    EmbeddingsModule,
    QdrantModule,
    DocumentParsingModule,
    RagRuntimeModule,
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentsRepository,
    DocumentParentsRepository,
    DocumentUploadValidationPipe,
  ],
  exports: [DocumentsService, DocumentParentsRepository],
})
export class DocumentsModule {}
