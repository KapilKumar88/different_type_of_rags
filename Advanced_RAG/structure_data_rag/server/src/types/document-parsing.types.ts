import type { SupportedDocumentExtension } from '../config/document-upload.config';
import type { ParsedStructuredTable } from './rag.types';

export type DocumentParseInput = {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
};

export type ParsedDocumentPage = {
  text: string;
  pageNumber?: number;
};

export type ParsedDocument = {
  pages: ParsedDocumentPage[];
  structuredTables: ParsedStructuredTable[];
};

export interface DocumentParser {
  readonly supportedExtensions: readonly SupportedDocumentExtension[];
  validateContentSignature(buffer: Buffer): boolean;
  parse(input: DocumentParseInput): Promise<ParsedDocument>;
}
