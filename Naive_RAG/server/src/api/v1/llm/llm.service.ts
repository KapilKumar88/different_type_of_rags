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

    if (typeof response.content === 'string') {
      return response.content.trim();
    }

    return response.content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if ('text' in item && typeof item.text === 'string') {
          return item.text;
        }

        return '';
      })
      .join('')
      .trim();
  }
}
