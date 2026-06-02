import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { CorrectiveRagModule } from '../../../services/corrective-rag/corrective-rag.module';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';

@Module({
  imports: [DocumentsModule, CorrectiveRagModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}
