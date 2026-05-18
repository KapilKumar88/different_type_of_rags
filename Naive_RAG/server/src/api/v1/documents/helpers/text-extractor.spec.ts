import { BadRequestException } from '@nestjs/common';
import {
  extractDocumentText,
  isSupportedDocument,
} from './text-extractor';

describe('text extractor', () => {
  it('accepts the supported learning app document types', () => {
    expect(isSupportedDocument('notes.txt')).toBe(true);
    expect(isSupportedDocument('guide.md')).toBe(true);
    expect(isSupportedDocument('data.csv')).toBe(true);
    expect(isSupportedDocument('manual.pdf')).toBe(true);
    expect(isSupportedDocument('brief.docx')).toBe(true);
  });

  it('rejects unsupported file types', async () => {
    await expect(
      extractDocumentText('image.png', Buffer.from('not text')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('extracts UTF-8 text from plain text documents', async () => {
    const result = await extractDocumentText(
      'notes.txt',
      Buffer.from('Naive RAG stores document chunks in Qdrant.'),
    );

    expect(result).toEqual({
      pages: [{ text: 'Naive RAG stores document chunks in Qdrant.' }],
    });
  });
});
