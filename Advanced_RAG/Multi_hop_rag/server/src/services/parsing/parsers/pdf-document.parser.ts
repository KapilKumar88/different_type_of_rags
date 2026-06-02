import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import type {
  DocumentParseInput,
  DocumentParser,
  ParsedDocument,
} from '../../../types/document-parsing.types';

@Injectable()
export class PdfDocumentParser implements DocumentParser {
  readonly supportedExtensions = ['.pdf'] as const;

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

      return { pages };
    } catch {
      throw new BadRequestException('Unable to extract text from PDF document');
    } finally {
      await parser.destroy();
    }
  }
}
