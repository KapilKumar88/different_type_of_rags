import { Injectable } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { HumanMessage } from '@langchain/core/messages';
import { ollamaConfig } from '../../config/ollama.config';

@Injectable()
export class LlmService {
  private readonly model = Object.assign(
    new ChatOllama(ollamaConfig.llmModel, {
      baseUrl: ollamaConfig.baseUrl,
    }),
    { temperature: 0 },
  );

  async generateAnswer(prompt: string): Promise<string> {
    const response = await this.model.invoke([new HumanMessage(prompt)]);

    return this.messageToText(response).trim();
  }

  async *streamAnswer(prompt: string): AsyncGenerator<string> {
    const stream = this.model.streamV2([new HumanMessage(prompt)]);

    for await (const token of stream.text) {
      yield token;
    }
  }

  private messageToText(message: unknown): string {
    if (!message || typeof message !== 'object') {
      return '';
    }

    if ('text' in message && typeof message.text === 'string') {
      return message.text;
    }

    if (!('content' in message)) {
      return '';
    }

    return this.contentToText(message.content);
  }

  private contentToText(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }

    if (!Array.isArray(content)) {
      return '';
    }

    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (
          item &&
          typeof item === 'object' &&
          'text' in item &&
          typeof item.text === 'string'
        ) {
          return item.text;
        }

        return '';
      })
      .join('');
  }
}
