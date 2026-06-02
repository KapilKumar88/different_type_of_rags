import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { EmbeddingsModule } from '../../../services/embeddings/embeddings.module';
import { LlmModule } from '../../../services/llm/llm.module';
import { RagRetrievalModule } from '../../../services/rag-retrieval/rag-retrieval.module';
import { RagRuntimeModule } from '../../../services/rag-runtime/rag-runtime.module';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';

@Module({
  imports: [
    DocumentsModule,
    EmbeddingsModule,
    LlmModule,
    RagRetrievalModule,
    RagRuntimeModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}
