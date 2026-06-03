import type { SupportedDocumentExtension } from '../config/document-upload.config';

export type DocumentParseInput = {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
};

export type ParsedDocumentPage = {
  text: string;
  pageNumber?: number;
};

export type ParsedImageSource = 'upload' | 'pdf' | 'docx';

export type ParsedImage = {
  data: Buffer;
  mimeType: string;
  width: number;
  height: number;
  pageNumber?: number;
  source: ParsedImageSource;
};

export type ParsedDocument = {
  pages: ParsedDocumentPage[];
  images: ParsedImage[];
};

export interface DocumentParser {
  readonly supportedExtensions: readonly SupportedDocumentExtension[];
  validateContentSignature(buffer: Buffer): boolean;
  parse(input: DocumentParseInput): Promise<ParsedDocument>;
}
