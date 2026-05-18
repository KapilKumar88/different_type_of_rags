import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { ChatService } from './chat.service';
import { askQuestionSchema, type AskQuestionDto } from './dto/ask-question.dto';

@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
