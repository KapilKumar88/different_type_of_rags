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
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { ragRateLimitConfig } from '../../../config/rag-rate-limit.config';
import { CurrentUser } from '../../../guard/decorators/current-user.decorator';
import {
  authCookieSecurityName,
  conversationDetailsSchema,
  conversationMessageSchema,
  conversationSchema,
  csrfErrorResponse,
  csrfSecurityName,
  notFoundErrorResponse,
  rateLimitErrorResponse,
  serverErrorResponse,
  successEnvelope,
  unauthorizedErrorResponse,
  validationErrorResponse,
} from '../../../swagger/openapi';
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

@ApiTags('Chat')
@ApiCookieAuth(authCookieSecurityName)
@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({
    summary: 'List conversations owned by the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversations retrieved successfully',
    schema: successEnvelope({
      type: 'object',
      required: ['conversations'],
      properties: {
        conversations: {
          type: 'array',
          items: conversationSchema,
        },
      },
    }),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    ...unauthorizedErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
  async listConversations(@CurrentUser() user: SafeUser) {
    const conversations = await this.chatService.listConversations(user.id);

    return {
      success: true,
      message: 'Conversations retrieved successfully',
      data: { conversations },
    };
  }

  @Post('conversations')
  @ApiSecurity(csrfSecurityName)
  @ApiOperation({ summary: 'Create a document-scoped conversation' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['documentIds'],
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 180 },
        documentIds: {
          type: 'array',
          minItems: 1,
          items: { type: 'string', format: 'uuid' },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Conversation created successfully',
    schema: successEnvelope({
      type: 'object',
      required: ['conversation'],
      properties: { conversation: conversationSchema },
    }),
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, ...validationErrorResponse })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    ...unauthorizedErrorResponse,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, ...csrfErrorResponse })
  @ApiTooManyRequestsResponse(rateLimitErrorResponse)
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
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
  @ApiOperation({ summary: 'Get one owned conversation with messages' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation retrieved successfully',
    schema: successEnvelope({
      type: 'object',
      required: ['conversation'],
      properties: { conversation: conversationDetailsSchema },
    }),
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, ...validationErrorResponse })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    ...unauthorizedErrorResponse,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, ...notFoundErrorResponse })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
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
  @ApiSecurity(csrfSecurityName)
  @ApiOperation({ summary: 'Update an owned conversation title' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 180 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation updated successfully',
    schema: successEnvelope({
      type: 'object',
      required: ['conversation'],
      properties: { conversation: conversationSchema },
    }),
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, ...validationErrorResponse })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    ...unauthorizedErrorResponse,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, ...csrfErrorResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, ...notFoundErrorResponse })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
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
  @ApiSecurity(csrfSecurityName)
  @ApiOperation({
    summary: 'Replace the selected documents for a conversation',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['documentIds'],
      properties: {
        documentIds: {
          type: 'array',
          minItems: 1,
          items: { type: 'string', format: 'uuid' },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation documents updated successfully',
    schema: successEnvelope({
      type: 'object',
      required: ['conversation'],
      properties: { conversation: conversationSchema },
    }),
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, ...validationErrorResponse })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    ...unauthorizedErrorResponse,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, ...csrfErrorResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, ...notFoundErrorResponse })
  @ApiTooManyRequestsResponse(rateLimitErrorResponse)
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
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
  @ApiSecurity(csrfSecurityName)
  @ApiOperation({ summary: 'Delete an owned conversation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation deleted successfully',
    schema: successEnvelope({
      type: 'object',
      required: ['conversation'],
      properties: { conversation: conversationSchema },
    }),
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, ...validationErrorResponse })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    ...unauthorizedErrorResponse,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, ...csrfErrorResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, ...notFoundErrorResponse })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
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
  @ApiSecurity(csrfSecurityName)
  @ApiOperation({ summary: 'Create a user message in an owned conversation' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        content: { type: 'string', minLength: 1 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Message created successfully',
    schema: successEnvelope({
      type: 'object',
      required: ['message'],
      properties: { message: conversationMessageSchema },
    }),
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, ...validationErrorResponse })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    ...unauthorizedErrorResponse,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, ...csrfErrorResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, ...notFoundErrorResponse })
  @ApiTooManyRequestsResponse(rateLimitErrorResponse)
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
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
  @ApiOperation({ summary: 'Stream an assistant answer for a user message' })
  @ApiProduces('text/event-stream')
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'SSE stream of sources, token, done, and error events for answer generation',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, ...validationErrorResponse })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    ...unauthorizedErrorResponse,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, ...notFoundErrorResponse })
  @ApiTooManyRequestsResponse(rateLimitErrorResponse)
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
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
