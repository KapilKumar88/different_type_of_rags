import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { ClipEmbeddingsModule } from '../../../services/clip-embeddings/clip-embeddings.module';
import { EmbeddingsModule } from '../../../services/embeddings/embeddings.module';
import { LlmModule } from '../../../services/llm/llm.module';
import { QdrantModule } from '../../../services/qdrant/qdrant.module';
import { RagRuntimeModule } from '../../../services/rag-runtime/rag-runtime.module';
import { VisionModule } from '../../../services/vision/vision.module';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';

@Module({
  imports: [
    DocumentsModule,
    EmbeddingsModule,
    ClipEmbeddingsModule,
    LlmModule,
    VisionModule,
    QdrantModule,
    RagRuntimeModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}
