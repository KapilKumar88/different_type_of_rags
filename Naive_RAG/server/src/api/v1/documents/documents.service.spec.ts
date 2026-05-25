import { BadRequestException, NotFoundException } from '@nestjs/common';
import { documentUploadConfig } from '../../../config/document-upload.config';
import type { Document } from '../../../database/schemas';
import { EmbeddingsService } from '../../../services/embeddings/embeddings.service';
import { QdrantService } from '../../../services/qdrant/qdrant.service';
import { DocumentsRepository } from './documents.repository';
import {
  DocumentsService,
  type UploadedDocumentFile,
} from './documents.service';
import { DocumentParsingService } from '../../../services/parsing/document-parsing.service';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-01T00:00:00.000Z');

function createDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'd79d5e51-4b9e-4db8-9440-961f98d4f61a',
    userId: 'user-1',
    fileName: 'rag-notes.txt',
    mimeType: 'text/plain',
    sizeBytes: 42,
    chunkCount: 1,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

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

describe('DocumentsService', () => {
  let documentsRepository: jest.Mocked<DocumentsRepository>;
  let embeddingsService: jest.Mocked<EmbeddingsService>;
  let qdrantService: jest.Mocked<QdrantService>;
  let documentParsingService: jest.Mocked<DocumentParsingService>;
  let documentsService: DocumentsService;

  beforeEach(() => {
    documentsRepository = {
      create: jest.fn(),
      findAllByUser: jest.fn(),
      findByIdForUser: jest.fn(),
      findByIdsForUser: jest.fn(),
      deleteByIdForUser: jest.fn(),
    } as unknown as jest.Mocked<DocumentsRepository>;
    embeddingsService = {
      embedDocuments: jest.fn(),
    } as unknown as jest.Mocked<EmbeddingsService>;
    qdrantService = {
      upsertPoints: jest.fn(),
      deleteByDocumentId: jest.fn(),
    } as unknown as jest.Mocked<QdrantService>;
    documentParsingService = {
      isSupportedDocument: jest.fn(),
      validateDocumentFileType: jest.fn(),
      parseDocument: jest.fn(
        async (
          _fileName: string,
          _mimeType: string | undefined,
          buffer: Buffer,
        ) => ({
          pages: [{ text: buffer.toString('utf8') }],
        }),
      ),
    } as unknown as jest.Mocked<DocumentParsingService>;
    documentsService = new DocumentsService(
      documentsRepository,
      embeddingsService,
      qdrantService,
      documentParsingService,
    );
  });

  it('extracts, chunks, embeds, stores vectors, and saves document metadata', async () => {
    const document = createDocument();
    embeddingsService.embedDocuments.mockResolvedValue([Array(768).fill(0.1)]);
    documentsRepository.create.mockResolvedValue(document);

    const result = await documentsService.upload('user-1', createFile());

    expect(documentParsingService.parseDocument).toHaveBeenCalledWith(
      'rag-notes.txt',
      'text/plain',
      expect.any(Buffer),
    );
    expect(embeddingsService.embedDocuments).toHaveBeenCalledWith([
      'Naive RAG retrieves chunks from Qdrant.',
    ]);
    expect(qdrantService.upsertPoints).toHaveBeenCalledWith([
      expect.objectContaining({
        vector: Array(768).fill(0.1),
        payload: expect.objectContaining({
          fileName: 'rag-notes.txt',
          text: 'Naive RAG retrieves chunks from Qdrant.',
        }),
      }),
    ]);
    expect(documentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'rag-notes.txt',
        mimeType: 'text/plain',
        sizeBytes: 42,
        chunkCount: 1,
        userId: 'user-1',
      }),
    );
    expect(result).toBe(document);
  });

  it('keeps parser page numbers on vector payloads', async () => {
    const document = createDocument();
    documentParsingService.parseDocument.mockResolvedValue({
      pages: [{ text: 'Page specific text', pageNumber: 4 }],
    });
    embeddingsService.embedDocuments.mockResolvedValue([Array(768).fill(0.2)]);
    documentsRepository.create.mockResolvedValue(document);

    await documentsService.upload('user-1', createFile());

    expect(qdrantService.upsertPoints).toHaveBeenCalledWith([
      expect.objectContaining({
        payload: expect.objectContaining({
          text: 'Page specific text',
          pageNumber: 4,
        }),
      }),
    ]);
  });

  it('rejects documents with no readable text', async () => {
    await expect(
      documentsService.upload(
        'user-1',
        createFile({ buffer: Buffer.from('   ') }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects documents with too much extracted text', async () => {
    const text = 'a'.repeat(
      documentUploadConfig.maxExtractedTextCharacters + 1,
    );

    await expect(
      documentsService.upload(
        'user-1',
        createFile({
          size: Buffer.byteLength(text),
          buffer: Buffer.from(text),
        }),
      ),
    ).rejects.toThrow('Document text is too large to index');
    expect(embeddingsService.embedDocuments).not.toHaveBeenCalled();
  });

  it('rejects documents that create too many chunks', async () => {
    const text = 'a'.repeat(900_000);

    await expect(
      documentsService.upload(
        'user-1',
        createFile({
          size: Buffer.byteLength(text),
          buffer: Buffer.from(text),
        }),
      ),
    ).rejects.toThrow('Document has too many chunks to index');
    expect(embeddingsService.embedDocuments).not.toHaveBeenCalled();
  });

  it('lists only documents owned by the user', async () => {
    const documents = [createDocument()];
    documentsRepository.findAllByUser.mockResolvedValue(documents);

    await expect(documentsService.list('user-1')).resolves.toBe(documents);
    expect(documentsRepository.findAllByUser).toHaveBeenCalledWith('user-1');
  });

  it('finds selected documents only within the user scope', async () => {
    const documents = [createDocument()];
    documentsRepository.findByIdsForUser.mockResolvedValue(documents);

    await expect(
      documentsService.findByIds('user-1', [documents[0].id]),
    ).resolves.toBe(documents);
    expect(documentsRepository.findByIdsForUser).toHaveBeenCalledWith(
      'user-1',
      [documents[0].id],
    );
  });

  it('deletes vectors and metadata for an existing document', async () => {
    const document = createDocument();
    documentsRepository.findByIdForUser.mockResolvedValue(document);
    documentsRepository.deleteByIdForUser.mockResolvedValue(document);

    const result = await documentsService.delete('user-1', document.id);

    expect(documentsRepository.findByIdForUser).toHaveBeenCalledWith(
      'user-1',
      document.id,
    );
    expect(qdrantService.deleteByDocumentId).toHaveBeenCalledWith(document.id);
    expect(documentsRepository.deleteByIdForUser).toHaveBeenCalledWith(
      'user-1',
      document.id,
    );
    expect(result).toBe(document);
  });

  it('rejects deletion when the document does not exist for the user', async () => {
    documentsRepository.findByIdForUser.mockResolvedValue(null);

    await expect(
      documentsService.delete('user-1', 'd79d5e51-4b9e-4db8-9440-961f98d4f61a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(qdrantService.deleteByDocumentId).not.toHaveBeenCalled();
  });
});
