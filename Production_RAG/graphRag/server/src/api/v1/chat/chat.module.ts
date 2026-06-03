import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { GraphModule } from '../graph/graph.module';
import { LlmModule } from '../../../services/llm/llm.module';
import { RagRuntimeModule } from '../../../services/rag-runtime/rag-runtime.module';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';

@Module({
  imports: [DocumentsModule, GraphModule, LlmModule, RagRuntimeModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}
