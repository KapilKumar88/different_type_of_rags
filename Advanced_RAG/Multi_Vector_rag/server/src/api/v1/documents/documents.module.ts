import { Module } from '@nestjs/common';
import { MultiVectorRagModule } from '../../../services/multi-vector-rag/multi-vector-rag.module';
import { QdrantModule } from '../../../services/qdrant/qdrant.module';
import { RagRuntimeModule } from '../../../services/rag-runtime/rag-runtime.module';
import { DocumentsController } from './documents.controller';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';
import { DocumentParsingModule } from '../../../services/parsing/document-parsing.module';
import { DocumentUploadValidationPipe } from './pipes/document-upload-validation.pipe';

@Module({
  imports: [
    QdrantModule,
    MultiVectorRagModule,
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
