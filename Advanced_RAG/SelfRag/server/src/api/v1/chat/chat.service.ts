import {
  BadRequestException,
  Injectable,
  MessageEvent,
  NotFoundException,
} from '@nestjs/common';
import type { ConversationMessage } from '../../../database/schemas';
import type {
  RetrievalMetadata,
  RetrievedChunk,
} from '../../../types/rag.types';
import { SelfRagService } from '../../../services/self-rag/self-rag.service';
import { DocumentsService } from '../documents/documents.service';
import {
  ChatRepository,
  type ConversationWithDocumentIds,
} from './chat.repository';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { CreateMessageDto } from './dto/create-message.dto';
import type { UpdateConversationDocumentsDto } from './dto/update-conversation-documents.dto';
import type { UpdateConversationDto } from './dto/update-conversation.dto';

export type ConversationSummary = ConversationWithDocumentIds;

export type ConversationDetails = ConversationWithDocumentIds & {
  messages: ConversationMessage[];
};

export type ConversationAnswerContext = {
  conversation: ConversationWithDocumentIds;
  sources: RetrievedChunk[];
  retrievalMetadata: RetrievalMetadata;
};

export type ChatStreamEventType = 'sources' | 'token' | 'done' | 'error';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly documentsService: DocumentsService,
    private readonly selfRagService: SelfRagService,
  ) {}

  listConversations(userId: string): Promise<ConversationSummary[]> {
    return this.chatRepository.findConversationsByUser(userId);
  }

  async createConversation(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<ConversationSummary> {
    const documentIds = await this.validateSelectedDocuments(
      userId,
      dto.documentIds,
    );

    return this.chatRepository.createConversation(
      {
        userId,
        title: dto.title ?? 'New conversation',
      },
      documentIds,
    );
  }

  async getConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationDetails> {
    const conversation = await this.getOwnedConversation(
      userId,
      conversationId,
    );
    const messages =
      await this.chatRepository.findMessagesByConversation(conversationId);

    return {
      ...conversation,
      messages,
    };
  }

  async updateConversation(
    userId: string,
    conversationId: string,
    dto: UpdateConversationDto,
  ): Promise<ConversationSummary> {
    await this.getOwnedConversation(userId, conversationId);

    const conversation = await this.chatRepository.updateConversationTitle(
      conversationId,
      dto.title,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async updateConversationDocuments(
    userId: string,
    conversationId: string,
    dto: UpdateConversationDocumentsDto,
  ): Promise<ConversationSummary> {
    await this.getOwnedConversation(userId, conversationId);

    const documentIds = await this.validateSelectedDocuments(
      userId,
      dto.documentIds,
    );
    const conversation = await this.chatRepository.replaceConversationDocuments(
      conversationId,
      documentIds,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async deleteConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationSummary> {
    await this.getOwnedConversation(userId, conversationId);

    const conversation =
      await this.chatRepository.deleteConversation(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async createUserMessage(
    userId: string,
    conversationId: string,
    dto: CreateMessageDto,
  ): Promise<ConversationMessage> {
    await this.getOwnedConversation(userId, conversationId);

    return this.chatRepository.createMessage({
      conversationId,
      role: 'user',
      content: dto.content,
    });
  }

  async getConversationAnswerContext(
    userId: string,
    conversationId: string,
    question: string,
  ): Promise<ConversationAnswerContext> {
    const conversation = await this.getOwnedConversation(
      userId,
      conversationId,
    );
    const messages =
      await this.chatRepository.findMessagesByConversation(conversationId);
    const result = await this.selfRagService.generateAnswer({
      latestUserMessage: question,
      historyMessages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      documentIds: conversation.documentIds,
    });

    return {
      conversation,
      sources: result.sources,
      retrievalMetadata: result.retrievalMetadata,
    };
  }

  async *streamConversationAnswer(
    userId: string,
    conversationId: string,
    messageId: string,
  ): AsyncGenerator<MessageEvent> {
    try {
      const conversation = await this.getOwnedConversation(
        userId,
        conversationId,
      );
      const userMessage = await this.getUserMessage(conversationId, messageId);
      const messages =
        await this.chatRepository.findMessagesByConversation(conversationId);
      const result = await this.selfRagService.generateAnswer({
        latestUserMessage: userMessage.content,
        historyMessages: this.excludeLatestUserMessage(
          messages,
          userMessage.content,
        ).map((message) => ({
          role: message.role,
          content: message.content,
        })),
        documentIds: conversation.documentIds,
      });

      yield this.createStreamEvent('sources', {
        sources: result.sources,
        retrievalMetadata: result.retrievalMetadata,
      });
      yield this.createStreamEvent('token', { token: result.answer });

      const message = await this.chatRepository.createMessage({
        conversationId,
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
        retrievalMetadata: result.retrievalMetadata,
      });

      yield this.createStreamEvent('done', { message });
    } catch (error) {
      yield this.createStreamErrorEvent(error);
    }
  }

  private excludeLatestUserMessage(
    messages: ConversationMessage[],
    latestUserMessage: string,
  ): ConversationMessage[] {
    return messages.filter((message, index) => {
      return !(
        index === messages.length - 1 &&
        message.role === 'user' &&
        message.content === latestUserMessage
      );
    });
  }

  private async getUserMessage(
    conversationId: string,
    messageId: string,
  ): Promise<ConversationMessage> {
    const message = await this.chatRepository.findMessageByConversation(
      conversationId,
      messageId,
    );

    if (message?.role !== 'user') {
      throw new NotFoundException('Conversation message not found');
    }

    return message;
  }

  private createStreamEvent(
    type: ChatStreamEventType,
    data: Record<string, unknown>,
  ): MessageEvent {
    return { type, data };
  }

  private createStreamErrorEvent(error: unknown): MessageEvent {
    if (error instanceof NotFoundException) {
      return this.createStreamEvent('error', {
        code: 'not_found',
        message: 'Conversation or message not found',
      });
    }

    if (error instanceof BadRequestException) {
      return this.createStreamEvent('error', {
        code: 'bad_request',
        message: 'Invalid chat stream request',
      });
    }

    return this.createStreamEvent('error', {
      code: 'stream_failed',
      message: 'Unable to stream assistant response',
    });
  }

  private async getOwnedConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationWithDocumentIds> {
    const conversation = await this.chatRepository.findConversationForUser(
      conversationId,
      userId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  private async validateSelectedDocuments(
    userId: string,
    documentIds: string[],
  ): Promise<string[]> {
    const uniqueDocumentIds = [...new Set(documentIds)];

    if (uniqueDocumentIds.length === 0) {
      throw new BadRequestException('Select at least one document');
    }

    const documents = await this.documentsService.findByIds(
      userId,
      uniqueDocumentIds,
    );

    if (documents.length !== uniqueDocumentIds.length) {
      throw new BadRequestException(
        'One or more selected documents were not found',
      );
    }

    return uniqueDocumentIds;
  }
}
