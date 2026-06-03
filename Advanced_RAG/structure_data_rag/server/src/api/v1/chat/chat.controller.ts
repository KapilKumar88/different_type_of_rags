import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  Patch,
  Post,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { ragRateLimitConfig } from '../../../config/rag-rate-limit.config';
import { CurrentUser } from '../../../guard/decorators/current-user.decorator';
import type { SafeUser } from '../../../types/auth.types';
import { ChatService } from './chat.service';
import {
  conversationIdSchema,
  type ConversationIdDto,
} from './dto/conversation-id.dto';
import {
  conversationMessageIdSchema,
  type ConversationMessageIdDto,
} from './dto/conversation-message-id.dto';
import {
  createConversationSchema,
  type CreateConversationDto,
} from './dto/create-conversation.dto';
import {
  createMessageSchema,
  type CreateMessageDto,
} from './dto/create-message.dto';
import {
  updateConversationDocumentsSchema,
  type UpdateConversationDocumentsDto,
} from './dto/update-conversation-documents.dto';
import {
  updateConversationSchema,
  type UpdateConversationDto,
} from './dto/update-conversation.dto';

@Controller('api/v1/chat')
@ApiTags('Chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  async listConversations(@CurrentUser() user: SafeUser) {
    const conversations = await this.chatService.listConversations(user.id);

    return {
      success: true,
      message: 'Conversations retrieved successfully',
      data: { conversations },
    };
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create a document-scoped conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  @ApiResponse({ status: 400, description: 'Invalid selected documents' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  @UseGuards(ThrottlerGuard)
  @Throttle({
    [ragRateLimitConfig.chat.name]: {
      limit: ragRateLimitConfig.chat.limit,
      ttl: ragRateLimitConfig.chat.ttlMs,
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(createConversationSchema))
    dto: CreateConversationDto,
  ) {
    const conversation = await this.chatService.createConversation(
      user.id,
      dto,
    );

    return {
      success: true,
      message: 'Conversation created successfully',
      data: { conversation },
    };
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ summary: 'Get a conversation with messages' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async getConversation(
    @CurrentUser() user: SafeUser,
    @Param(new ZodValidationPipe(conversationIdSchema))
    params: ConversationIdDto,
  ) {
    const conversation = await this.chatService.getConversation(
      user.id,
      params.conversationId,
    );

    return {
      success: true,
      message: 'Conversation retrieved successfully',
      data: { conversation },
    };
  }

  @Patch('conversations/:conversationId')
  @ApiOperation({ summary: 'Update a conversation title' })
  @ApiResponse({ status: 200, description: 'Conversation updated' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async updateConversation(
    @CurrentUser() user: SafeUser,
    @Param(new ZodValidationPipe(conversationIdSchema))
    params: ConversationIdDto,
    @Body(new ZodValidationPipe(updateConversationSchema))
    dto: UpdateConversationDto,
  ) {
    const conversation = await this.chatService.updateConversation(
      user.id,
      params.conversationId,
      dto,
    );

    return {
      success: true,
      message: 'Conversation updated successfully',
      data: { conversation },
    };
  }

  @Patch('conversations/:conversationId/documents')
  @ApiOperation({ summary: 'Update a conversation document scope' })
  @ApiResponse({ status: 200, description: 'Conversation documents updated' })
  @ApiResponse({ status: 400, description: 'Invalid selected documents' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  @UseGuards(ThrottlerGuard)
  @Throttle({
    [ragRateLimitConfig.chat.name]: {
      limit: ragRateLimitConfig.chat.limit,
      ttl: ragRateLimitConfig.chat.ttlMs,
    },
  })
  async updateConversationDocuments(
    @CurrentUser() user: SafeUser,
    @Param(new ZodValidationPipe(conversationIdSchema))
    params: ConversationIdDto,
    @Body(new ZodValidationPipe(updateConversationDocumentsSchema))
    dto: UpdateConversationDocumentsDto,
  ) {
    const conversation = await this.chatService.updateConversationDocuments(
      user.id,
      params.conversationId,
      dto,
    );

    return {
      success: true,
      message: 'Conversation documents updated successfully',
      data: { conversation },
    };
  }

  @Delete('conversations/:conversationId')
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiResponse({ status: 200, description: 'Conversation deleted' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async deleteConversation(
    @CurrentUser() user: SafeUser,
    @Param(new ZodValidationPipe(conversationIdSchema))
    params: ConversationIdDto,
  ) {
    const conversation = await this.chatService.deleteConversation(
      user.id,
      params.conversationId,
    );

    return {
      success: true,
      message: 'Conversation deleted successfully',
      data: { conversation },
    };
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Create a user message' })
  @ApiResponse({ status: 201, description: 'Message created' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  @UseGuards(ThrottlerGuard)
  @Throttle({
    [ragRateLimitConfig.chat.name]: {
      limit: ragRateLimitConfig.chat.limit,
      ttl: ragRateLimitConfig.chat.ttlMs,
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async createMessage(
    @CurrentUser() user: SafeUser,
    @Param(new ZodValidationPipe(conversationIdSchema))
    params: ConversationIdDto,
    @Body(new ZodValidationPipe(createMessageSchema)) dto: CreateMessageDto,
  ) {
    const message = await this.chatService.createUserMessage(
      user.id,
      params.conversationId,
      dto,
    );

    return {
      success: true,
      message: 'Message created successfully',
      data: { message },
    };
  }

  @Sse('conversations/:conversationId/messages/:messageId/stream')
  @ApiOperation({ summary: 'Stream a structured RAG answer for a message' })
  @ApiResponse({ status: 200, description: 'SSE answer stream' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 404, description: 'Conversation or message not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  @UseGuards(ThrottlerGuard)
  @Throttle({
    [ragRateLimitConfig.stream.name]: {
      limit: ragRateLimitConfig.stream.limit,
      ttl: ragRateLimitConfig.stream.ttlMs,
    },
  })
  streamMessage(
    @CurrentUser() user: SafeUser,
    @Param(new ZodValidationPipe(conversationMessageIdSchema))
    params: ConversationMessageIdDto,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let closed = false;

      void (async () => {
        for await (const event of this.chatService.streamConversationAnswer(
          user.id,
          params.conversationId,
          params.messageId,
        )) {
          if (closed) {
            break;
          }

          subscriber.next(event);
        }

        if (!closed) {
          subscriber.complete();
        }
      })().catch((error: unknown) => {
        if (!closed) {
          subscriber.error(error);
        }
      });

      return () => {
        closed = true;
      };
    });
  }
}
