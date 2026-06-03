import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import { documentUploadConfig } from '../../../config/document-upload.config';
import type {
  DocumentParseInput,
  DocumentParser,
  ParsedDocument,
  ParsedImage,
} from '../../../types/document-parsing.types';
import { normalizeImage } from '../helpers/image.helpers';

@Injectable()
export class PdfDocumentParser implements DocumentParser {
  readonly supportedExtensions = ['.pdf'] as const;
  private readonly logger = new Logger(PdfDocumentParser.name);

  validateContentSignature(buffer: Buffer): boolean {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  async parse(input: DocumentParseInput): Promise<ParsedDocument> {
    const parser = new PDFParse({ data: input.buffer });

    try {
      const result = await parser.getText();
      const pages = result.pages.map((page) => ({
        text: page.text,
        pageNumber: page.num,
      }));
      const images = await this.extractImages(parser);

      return { pages, images };
    } catch {
      throw new BadRequestException('Unable to extract text from PDF document');
    } finally {
      await parser.destroy();
    }
  }

  /**
   * Embedded-image extraction is best-effort: a failure here must never break
   * text extraction, which is the primary signal for most PDFs.
   */
  private async extractImages(parser: PDFParse): Promise<ParsedImage[]> {
    try {
      const result = await parser.getImage({
        imageBuffer: true,
        imageThreshold: documentUploadConfig.minExtractedImagePx,
      });
      const images: ParsedImage[] = [];

      for (const page of result.pages) {
        for (const embedded of page.images) {
          if (!embedded.data) {
            continue;
          }

          const normalized = await normalizeImage(Buffer.from(embedded.data), {
            source: 'pdf',
            pageNumber: page.pageNumber,
          });

          if (normalized) {
            images.push(normalized);
          }
        }
      }

      return images;
    } catch (error) {
      this.logger.warn(
        `Failed to extract embedded images from PDF: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );

      return [];
    }
  }
}
