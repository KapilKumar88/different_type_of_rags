import { BadRequestException, Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import type {
  DocumentParseInput,
  DocumentParser,
  ParsedDocument,
} from '../../../types/document-parsing.types';

@Injectable()
export class DocxDocumentParser implements DocumentParser {
  readonly supportedExtensions = ['.docx'] as const;

  validateContentSignature(buffer: Buffer): boolean {
    return buffer.subarray(0, 2).toString('ascii') === 'PK';
  }

  async parse(input: DocumentParseInput): Promise<ParsedDocument> {
    try {
      const result = await mammoth.extractRawText({ buffer: input.buffer });

      return {
        pages: [{ text: result.value }],
      };
    } catch {
      throw new BadRequestException(
        'Unable to extract text from DOCX document',
      );
    }
  }
}
