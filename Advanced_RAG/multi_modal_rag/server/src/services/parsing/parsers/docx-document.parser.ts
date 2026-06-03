import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import type {
  DocumentParseInput,
  DocumentParser,
  ParsedDocument,
  ParsedImage,
} from '../../../types/document-parsing.types';
import { normalizeImage } from '../helpers/image.helpers';

@Injectable()
export class DocxDocumentParser implements DocumentParser {
  readonly supportedExtensions = ['.docx'] as const;
  private readonly logger = new Logger(DocxDocumentParser.name);

  validateContentSignature(buffer: Buffer): boolean {
    return buffer.subarray(0, 2).toString('ascii') === 'PK';
  }

  async parse(input: DocumentParseInput): Promise<ParsedDocument> {
    try {
      const result = await mammoth.extractRawText({ buffer: input.buffer });
      const images = await this.extractImages(input.buffer);

      return {
        pages: [{ text: result.value }],
        images,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Unable to extract text from DOCX document',
      );
    }
  }

  /**
   * Collect embedded images by running a second mammoth pass with a custom image
   * handler. Best-effort: image failures must not break text extraction.
   */
  private async extractImages(buffer: Buffer): Promise<ParsedImage[]> {
    const collected: Buffer[] = [];

    try {
      await mammoth.convertToHtml(
        { buffer },
        {
          convertImage: mammoth.images.imgElement(async (image) => {
            try {
              const imageBuffer = await image.read();
              collected.push(Buffer.from(imageBuffer));
            } catch {
              // Ignore unreadable images.
            }

            return { src: '' };
          }),
        },
      );
    } catch (error) {
      this.logger.warn(
        `Failed to extract embedded images from DOCX: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );

      return [];
    }

    const images: ParsedImage[] = [];

    for (const imageBuffer of collected) {
      const normalized = await normalizeImage(imageBuffer, { source: 'docx' });

      if (normalized) {
        images.push(normalized);
      }
    }

    return images;
  }
}
