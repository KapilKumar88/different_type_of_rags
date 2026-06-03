import { Module } from '@nestjs/common';
import { ClipEmbeddingsModule } from '../../../services/clip-embeddings/clip-embeddings.module';
import { EmbeddingsModule } from '../../../services/embeddings/embeddings.module';
import { QdrantModule } from '../../../services/qdrant/qdrant.module';
import { RagRuntimeModule } from '../../../services/rag-runtime/rag-runtime.module';
import { VisionModule } from '../../../services/vision/vision.module';
import { DocumentImagesRepository } from './document-images.repository';
import { DocumentsController } from './documents.controller';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';
import { DocumentParsingModule } from '../../../services/parsing/document-parsing.module';
import { DocumentUploadValidationPipe } from './pipes/document-upload-validation.pipe';

@Module({
  imports: [
    EmbeddingsModule,
    ClipEmbeddingsModule,
    VisionModule,
    QdrantModule,
    DocumentParsingModule,
    RagRuntimeModule,
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentsRepository,
    DocumentImagesRepository,
    DocumentUploadValidationPipe,
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
