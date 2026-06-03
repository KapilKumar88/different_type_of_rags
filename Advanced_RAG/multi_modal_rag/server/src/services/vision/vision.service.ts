import { Injectable } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { HumanMessage, type MessageContent } from '@langchain/core/messages';
import { ollamaConfig } from '../../config/ollama.config';

export type VisionImage = {
  data: Buffer;
  mimeType: string;
};

const captionPrompt =
  'Describe this image in detail for search and retrieval. Include any visible text, ' +
  'chart/table data, objects, and what the image depicts. Respond with the description only.';

/**
 * Vision-capable answer generation. Sends retrieved image bytes alongside the
 * text prompt to an Ollama vision model so answers can be grounded in the actual
 * images, not just their captions.
 */
@Injectable()
export class VisionService {
  private readonly model = new ChatOllama({
    baseUrl: ollamaConfig.baseUrl,
    model: ollamaConfig.visionModel,
    temperature: 0,
  });

  async *streamAnswer(
    prompt: string,
    images: VisionImage[],
  ): AsyncGenerator<string> {
    const message = this.buildMessage(prompt, images);
    const stream = await this.model.stream([message]);

    for await (const chunk of stream) {
      const token = this.contentToText(chunk.content);

      if (token) {
        yield token;
      }
    }
  }

  async describeImage(image: VisionImage): Promise<string> {
    const message = this.buildMessage(captionPrompt, [image]);
    const response = await this.model.invoke([message]);

    return this.contentToText(response.content).trim();
  }

  private buildMessage(prompt: string, images: VisionImage[]): HumanMessage {
    const content: MessageContent = [
      { type: 'text', text: prompt },
      ...images.map((image) => ({
        type: 'image_url' as const,
        image_url: {
          url: `data:${image.mimeType};base64,${image.data.toString('base64')}`,
        },
      })),
    ];

    return new HumanMessage({ content });
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
