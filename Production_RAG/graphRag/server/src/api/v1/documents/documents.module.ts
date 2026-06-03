import { Module } from '@nestjs/common';
import { GraphModule } from '../graph/graph.module';
import { DocumentParsingModule } from '../../../services/parsing/document-parsing.module';
import { RagRuntimeModule } from '../../../services/rag-runtime/rag-runtime.module';
import { DocumentsController } from './documents.controller';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';
import { DocumentUploadValidationPipe } from './pipes/document-upload-validation.pipe';

@Module({
  imports: [GraphModule, DocumentParsingModule, RagRuntimeModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentsRepository,
    DocumentUploadValidationPipe,
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
