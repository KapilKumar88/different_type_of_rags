import { BadRequestException } from '@nestjs/common';
import { DocumentParsingService } from './document-parsing.service';
import { DocxDocumentParser } from './parsers/docx-document.parser';
import { PdfDocumentParser } from './parsers/pdf-document.parser';
import { PlainTextDocumentParser } from './parsers/plain-text-document.parser';
import { XlsxDocumentParser } from './parsers/xlsx-document.parser';

describe('DocumentParsingService', () => {
  let parsingService: DocumentParsingService;

  beforeEach(() => {
    parsingService = new DocumentParsingService(
      new PlainTextDocumentParser(),
      new PdfDocumentParser(),
      new DocxDocumentParser(),
      new XlsxDocumentParser(),
    );
  });

  it('accepts the supported learning app document types', () => {
    expect(parsingService.isSupportedDocument('notes.txt')).toBe(true);
    expect(parsingService.isSupportedDocument('guide.md')).toBe(true);
    expect(parsingService.isSupportedDocument('data.csv')).toBe(true);
    expect(parsingService.isSupportedDocument('data.json')).toBe(true);
    expect(parsingService.isSupportedDocument('data.xlsx')).toBe(true);
    expect(parsingService.isSupportedDocument('manual.pdf')).toBe(true);
    expect(parsingService.isSupportedDocument('brief.docx')).toBe(true);
  });

  it('rejects unsupported file types', async () => {
    await expect(
      parsingService.parseDocument(
        'image.png',
        'image/png',
        Buffer.from('not text'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('extracts UTF-8 text from plain text documents', async () => {
    const result = await parsingService.parseDocument(
      'notes.txt',
      'text/plain',
      Buffer.from('Naive RAG stores document chunks in Qdrant.'),
    );

    expect(result).toEqual({
      pages: [{ text: 'Naive RAG stores document chunks in Qdrant.' }],
      structuredTables: [],
    });
  });

  it('rejects MIME types that do not match the extension', () => {
    expect(() =>
      parsingService.validateDocumentFileType(
        'notes.pdf',
        'text/plain',
        Buffer.from('%PDF-1.7'),
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects content signatures that do not match binary document extensions', () => {
    expect(() =>
      parsingService.validateDocumentFileType(
        'notes.pdf',
        'application/pdf',
        Buffer.from('not a pdf'),
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects text uploads that contain null bytes', () => {
    expect(() =>
      parsingService.validateDocumentFileType(
        'notes.txt',
        'text/plain',
        Buffer.from([65, 0, 66]),
      ),
    ).toThrow(BadRequestException);
  });

  it('accepts matching plain text uploads', () => {
    expect(() =>
      parsingService.validateDocumentFileType(
        'notes.txt',
        'text/plain; charset=utf-8',
        Buffer.from('Safe text'),
      ),
    ).not.toThrow();
  });

  it('wraps invalid PDF parser failures as bad requests', async () => {
    await expect(
      parsingService.parseDocument(
        'notes.pdf',
        'application/pdf',
        Buffer.from('%PDF-1.7 invalid'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('wraps invalid DOCX parser failures as bad requests', async () => {
    await expect(
      parsingService.parseDocument(
        'notes.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        Buffer.from('PK invalid'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
