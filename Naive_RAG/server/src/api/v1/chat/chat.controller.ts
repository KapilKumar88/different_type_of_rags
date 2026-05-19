import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../../guard/decorators/current-user.decorator';
import type { SafeUser } from '../../../types/auth.types';
import { ChatService } from './chat.service';
import { askQuestionSchema, type AskQuestionDto } from './dto/ask-question.dto';
import {
  conversationIdSchema,
  type ConversationIdDto,
} from './dto/conversation-id.dto';
import {
  createConversationSchema,
  type CreateConversationDto,
} from './dto/create-conversation.dto';
import {
  createMessageSchema,
  type CreateMessageDto,
} from './dto/create-message.dto';

@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async listConversations(@CurrentUser() user: SafeUser) {
    const conversations = await this.chatService.listConversations(user.id);

    return {
      success: true,
      message: 'Conversations retrieved successfully',
      data: { conversations },
    };
  }

  @Post('conversations')
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

  @Post('conversations/:conversationId/messages')
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

  @Post('ask')
  @HttpCode(HttpStatus.OK)
  async ask(
    @Body(new ZodValidationPipe(askQuestionSchema)) dto: AskQuestionDto,
  ) {
    const result = await this.chatService.ask(dto);

    return {
      success: true,
      message: 'Answer generated successfully',
      data: result,
    };
  }
}
