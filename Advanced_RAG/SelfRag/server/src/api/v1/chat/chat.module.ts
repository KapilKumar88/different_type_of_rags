import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { SelfRagModule } from '../../../services/self-rag/self-rag.module';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';

@Module({
  imports: [DocumentsModule, SelfRagModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}
