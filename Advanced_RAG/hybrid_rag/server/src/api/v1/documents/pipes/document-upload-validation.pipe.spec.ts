import { BadRequestException } from '@nestjs/common';
import { documentUploadConfig } from '../../../../config/document-upload.config';
import type { UploadedDocumentFile } from '../documents.service';
import { DocumentParsingService } from '../../../../services/parsing/document-parsing.service';
import { DocumentUploadValidationPipe } from './document-upload-validation.pipe';

function createFile(
  overrides: Partial<UploadedDocumentFile> = {},
): UploadedDocumentFile {
  return {
    originalname: 'rag-notes.txt',
    mimetype: 'text/plain',
    size: 42,
    buffer: Buffer.from('Naive RAG retrieves chunks from Qdrant.'),
    ...overrides,
  };
}

describe('DocumentUploadValidationPipe', () => {
  let documentParsingService: jest.Mocked<DocumentParsingService>;
  let pipe: DocumentUploadValidationPipe;

  beforeEach(() => {
    documentParsingService = {
      isSupportedDocument: jest.fn().mockReturnValue(true),
      validateDocumentFileType: jest.fn(),
      parseDocument: jest.fn(),
    } as unknown as jest.Mocked<DocumentParsingService>;
    pipe = new DocumentUploadValidationPipe(documentParsingService);
  });

  it('returns valid document uploads', () => {
    const file = createFile();

    expect(pipe.transform(file)).toBe(file);
    expect(documentParsingService.validateDocumentFileType).toHaveBeenCalledWith(
      'rag-notes.txt',
      'text/plain',
      file.buffer,
    );
  });

  it('rejects missing files', () => {
    expect(() => pipe.transform(undefined)).toThrow(BadRequestException);
  });

  it('rejects unsupported document extensions', () => {
    documentParsingService.isSupportedDocument.mockReturnValue(false);

    expect(() =>
      pipe.transform(
        createFile({
          originalname: 'image.png',
          mimetype: 'image/png',
        }),
      ),
    ).toThrow('Unsupported file type');
  });

  it('rejects oversized files', () => {
    expect(() =>
      pipe.transform(
        createFile({
          size: documentUploadConfig.maxFileSizeBytes + 1,
        }),
      ),
    ).toThrow('Document file is too large');
  });

  it('rejects mismatched MIME types', () => {
    documentParsingService.validateDocumentFileType.mockImplementation(() => {
      throw new BadRequestException(
        'Uploaded document MIME type does not match the file extension',
      );
    });

    expect(() =>
      pipe.transform(
        createFile({
          originalname: 'rag-notes.pdf',
          mimetype: 'text/plain',
          buffer: Buffer.from('%PDF-1.7'),
        }),
      ),
    ).toThrow('Uploaded document MIME type does not match');
  });

  it('rejects mismatched content signatures', () => {
    documentParsingService.validateDocumentFileType.mockImplementation(() => {
      throw new BadRequestException(
        'Uploaded document content does not match the file extension',
      );
    });

    expect(() =>
      pipe.transform(
        createFile({
          originalname: 'rag-notes.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.from('not a pdf'),
        }),
      ),
    ).toThrow('Uploaded document content does not match');
  });
});
