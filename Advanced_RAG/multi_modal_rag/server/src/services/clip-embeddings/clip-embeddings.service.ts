import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  AutoProcessor,
  AutoTokenizer,
  CLIPTextModelWithProjection,
  CLIPVisionModelWithProjection,
  RawImage,
} from '@huggingface/transformers';
import sharp from 'sharp';
import { clipConfig } from '../../config/clip.config';
import { qdrantConfig } from '../../config/qdrant.config';

// Transformers.js model/tokenizer/processor instances are callable at runtime but
// are not typed as callable, so we narrow them to the small surface we use.
type ClipTensor = { tolist(): unknown };
type ClipModel = (inputs: unknown) => Promise<Record<string, ClipTensor>>;
type ClipTokenizer = (
  texts: string[],
  options: { padding: boolean; truncation: boolean },
) => unknown;
type ClipProcessor = (image: RawImage) => Promise<unknown>;

type TextEncoder = { tokenizer: ClipTokenizer; model: ClipModel };
type ImageEncoder = { processor: ClipProcessor; model: ClipModel };

/**
 * Embeds images and text queries into a shared CLIP vector space so a text query
 * can retrieve semantically related images. Models run in-process via
 * Transformers.js (ONNX) and are lazily loaded on first use; weights download
 * from Hugging Face once and are cached on disk.
 */
@Injectable()
export class ClipEmbeddingsService {
  private readonly logger = new Logger(ClipEmbeddingsService.name);
  private textEncoderPromise?: Promise<TextEncoder>;
  private imageEncoderPromise?: Promise<ImageEncoder>;

  async embedText(text: string): Promise<number[]> {
    const { tokenizer, model } = await this.getTextEncoder();
    const inputs = tokenizer([text], { padding: true, truncation: true });
    const output = await model(inputs);

    return this.normalize(this.firstRow(output.text_embeds));
  }

  async embedImage(image: Buffer): Promise<number[]> {
    const { processor, model } = await this.getImageEncoder();
    const rawImage = await this.toRawImage(image);
    const inputs = await processor(rawImage);
    const output = await model(inputs);

    return this.normalize(this.firstRow(output.image_embeds));
  }

  private async toRawImage(image: Buffer): Promise<RawImage> {
    const { data, info } = await sharp(image, { failOn: 'none' })
      .flatten({ background: '#ffffff' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return new RawImage(
      new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
      info.width,
      info.height,
      3,
    );
  }

  private getTextEncoder(): Promise<TextEncoder> {
    this.textEncoderPromise ??= this.loadTextEncoder();

    return this.textEncoderPromise;
  }

  private getImageEncoder(): Promise<ImageEncoder> {
    this.imageEncoderPromise ??= this.loadImageEncoder();

    return this.imageEncoderPromise;
  }

  private async loadTextEncoder(): Promise<TextEncoder> {
    this.logger.log(`Loading CLIP text encoder "${clipConfig.model}"`);
    const [tokenizer, model] = await Promise.all([
      AutoTokenizer.from_pretrained(clipConfig.model),
      CLIPTextModelWithProjection.from_pretrained(clipConfig.model),
    ]);

    return {
      tokenizer: tokenizer as unknown as ClipTokenizer,
      model: model as unknown as ClipModel,
    };
  }

  private async loadImageEncoder(): Promise<ImageEncoder> {
    this.logger.log(`Loading CLIP vision encoder "${clipConfig.model}"`);
    const [processor, model] = await Promise.all([
      AutoProcessor.from_pretrained(clipConfig.model),
      CLIPVisionModelWithProjection.from_pretrained(clipConfig.model),
    ]);

    return {
      processor: processor as unknown as ClipProcessor,
      model: model as unknown as ClipModel,
    };
  }

  private firstRow(tensor: ClipTensor | undefined): number[] {
    const values = tensor?.tolist();

    if (!Array.isArray(values) || !Array.isArray(values[0])) {
      throw new InternalServerErrorException(
        'Unexpected CLIP embedding output shape',
      );
    }

    return values[0] as number[];
  }

  private normalize(vector: number[]): number[] {
    if (vector.length !== qdrantConfig.imageVectorSize) {
      throw new InternalServerErrorException(
        `CLIP embedding size ${vector.length} does not match Qdrant image vector size ${qdrantConfig.imageVectorSize}`,
      );
    }

    const magnitude = Math.sqrt(
      vector.reduce((sum, value) => sum + value * value, 0),
    );

    if (magnitude === 0) {
      return vector;
    }

    return vector.map((value) => value / magnitude);
  }
}
