import { Injectable } from '@nestjs/common';
import type {
  DocumentParseInput,
  DocumentParser,
  ParsedDocument,
} from '../../../types/document-parsing.types';

@Injectable()
export class PlainTextDocumentParser implements DocumentParser {
  readonly supportedExtensions = ['.txt', '.md', '.csv'] as const;

  validateContentSignature(buffer: Buffer): boolean {
    return !buffer.subarray(0, Math.min(buffer.length, 1024)).includes(0);
  }

  async parse(input: DocumentParseInput): Promise<ParsedDocument> {
    return {
      pages: [{ text: input.buffer.toString('utf8') }],
      images: [],
    };
  }
}
