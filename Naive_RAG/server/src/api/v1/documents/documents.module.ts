import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ragRateLimitConfig } from '../../../config/rag-rate-limit.config';
import { EmbeddingsModule } from '../../../services/embeddings/embeddings.module';
import { QdrantModule } from '../../../services/qdrant/qdrant.module';
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
    DocumentParsingModule,
    RagRuntimeModule,
    ThrottlerModule.forRoot([
      {
        name: ragRateLimitConfig.upload.name,
        ttl: ragRateLimitConfig.upload.ttlMs,
        limit: ragRateLimitConfig.upload.limit,
      },
    ]),
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
