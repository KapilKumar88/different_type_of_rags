import { Injectable } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { HumanMessage } from '@langchain/core/messages';
import { ollamaConfig } from '../../../config/ollama.config';

@Injectable()
export class LlmService {
  private readonly model = new ChatOllama({
    baseUrl: ollamaConfig.baseUrl,
    model: ollamaConfig.llmModel,
    temperature: 0,
  });

  async generateAnswer(prompt: string): Promise<string> {
    const response = await this.model.invoke([new HumanMessage(prompt)]);

    return this.contentToText(response.content).trim();
  }

  async *streamAnswer(prompt: string): AsyncGenerator<string> {
    const stream = await this.model.stream([new HumanMessage(prompt)]);

    for await (const chunk of stream) {
      const token = this.contentToText(chunk.content);

      if (token) {
        yield token;
      }
    }
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

        if ('text' in item && typeof item.text === 'string') {
          return item.text;
        }

        return '';
      })
      .join('');
  }
}
