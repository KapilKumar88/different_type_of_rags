import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { EmbeddingsModule } from '../../../services/embeddings/embeddings.module';
import { LlmModule } from '../../../services/llm/llm.module';
import { MultiQueryModule } from '../../../services/multi-query/multi-query.module';
import { QdrantModule } from '../../../services/qdrant/qdrant.module';
import { RagRuntimeModule } from '../../../services/rag-runtime/rag-runtime.module';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';

@Module({
  imports: [
    DocumentsModule,
    EmbeddingsModule,
    LlmModule,
    MultiQueryModule,
    QdrantModule,
    RagRuntimeModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}
