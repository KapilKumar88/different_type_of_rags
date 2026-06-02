import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { LlmModule } from '../../../services/llm/llm.module';
import { MultiVectorRagModule } from '../../../services/multi-vector-rag/multi-vector-rag.module';
import { RagRuntimeModule } from '../../../services/rag-runtime/rag-runtime.module';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';

@Module({
  imports: [
    DocumentsModule,
    LlmModule,
    MultiVectorRagModule,
    RagRuntimeModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}
