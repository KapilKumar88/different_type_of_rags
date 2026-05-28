import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ragRateLimitConfig } from '../../../config/rag-rate-limit.config';
import { DocumentsModule } from '../documents/documents.module';
import { EmbeddingsModule } from '../../../services/embeddings/embeddings.module';
import { LlmModule } from '../../../services/llm/llm.module';
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
    QdrantModule,
    RagRuntimeModule,
    ThrottlerModule.forRoot([
      {
        name: ragRateLimitConfig.chat.name,
        ttl: ragRateLimitConfig.chat.ttlMs,
        limit: ragRateLimitConfig.chat.limit,
      },
      {
        name: ragRateLimitConfig.stream.name,
        ttl: ragRateLimitConfig.stream.ttlMs,
        limit: ragRateLimitConfig.stream.limit,
      },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}
