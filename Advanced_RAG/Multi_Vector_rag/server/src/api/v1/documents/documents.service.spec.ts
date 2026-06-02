import { BadRequestException, NotFoundException } from '@nestjs/common';
import { documentUploadConfig } from '../../../config/document-upload.config';
import type { Document } from '../../../database/schemas';
import { MultiVectorIndexingService } from '../../../services/multi-vector-rag/multi-vector-indexing.service';
import { QdrantService } from '../../../services/qdrant/qdrant.service';
import { RagConcurrencyLimiterService } from '../../../services/rag-runtime/rag-concurrency-limiter.service';
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
  let multiVectorIndexingService: jest.Mocked<MultiVectorIndexingService>;
  let qdrantService: jest.Mocked<QdrantService>;
  let documentParsingService: jest.Mocked<DocumentParsingService>;
  let ragConcurrencyLimiter: jest.Mocked<RagConcurrencyLimiterService>;
  let documentsService: DocumentsService;

  beforeEach(() => {
    documentsRepository = {
      create: jest.fn(),
      findAllByUser: jest.fn(),
      findByIdForUser: jest.fn(),
      findByIdsForUser: jest.fn(),
      deleteByIdForUser: jest.fn(),
    } as unknown as jest.Mocked<DocumentsRepository>;
    multiVectorIndexingService = {
      indexDocument: jest.fn(),
    } as unknown as jest.Mocked<MultiVectorIndexingService>;
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
    ragConcurrencyLimiter = {
      run: jest.fn(async (_key, task: () => Promise<unknown>) => task()),
    } as unknown as jest.Mocked<RagConcurrencyLimiterService>;
    documentsService = new DocumentsService(
      documentsRepository,
      qdrantService,
      multiVectorIndexingService,
      documentParsingService,
      ragConcurrencyLimiter,
    );
  });

  it('extracts, chunks, multi-vector indexes, and saves document metadata', async () => {
    const document = createDocument();
    documentsRepository.create.mockResolvedValue(document);

    const result = await documentsService.upload('user-1', createFile());

    expect(documentParsingService.parseDocument).toHaveBeenCalledWith(
      'rag-notes.txt',
      'text/plain',
      expect.any(Buffer),
    );
    expect(multiVectorIndexingService.indexDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: expect.any(String),
        fileName: 'rag-notes.txt',
        chunks: [{ text: 'Naive RAG retrieves chunks from Qdrant.' }],
      }),
    );
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
    documentsRepository.create.mockResolvedValue(document);

    await documentsService.upload('user-1', createFile());

    expect(multiVectorIndexingService.indexDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        chunks: [{ text: 'Page specific text', pageNumber: 4 }],
      }),
    );
  });

  it('cleans up uploaded vectors when metadata creation fails', async () => {
    const databaseError = new Error('database unavailable');
    documentsRepository.create.mockRejectedValue(databaseError);

    await expect(
      documentsService.upload('user-1', createFile()),
    ).rejects.toThrow(databaseError);

    const indexedDocument = multiVectorIndexingService.indexDocument.mock
      .calls[0]?.[0];
    const documentId = indexedDocument?.documentId;
    expect(documentId).toEqual(expect.any(String));
    expect(qdrantService.deleteByDocumentId).toHaveBeenCalledWith(documentId);
  });

  it('does not create metadata when multi-vector indexing fails', async () => {
    const indexingError = new Error('qdrant unavailable');
    multiVectorIndexingService.indexDocument.mockRejectedValue(indexingError);

    await expect(
      documentsService.upload('user-1', createFile()),
    ).rejects.toThrow(indexingError);

    expect(documentsRepository.create).not.toHaveBeenCalled();
    expect(qdrantService.deleteByDocumentId).not.toHaveBeenCalled();
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
    expect(multiVectorIndexingService.indexDocument).not.toHaveBeenCalled();
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
    expect(multiVectorIndexingService.indexDocument).not.toHaveBeenCalled();
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

  it('does not delete metadata when Qdrant deletion fails', async () => {
    const document = createDocument();
    const qdrantError = new Error('qdrant unavailable');
    documentsRepository.findByIdForUser.mockResolvedValue(document);
    qdrantService.deleteByDocumentId.mockRejectedValueOnce(qdrantError);

    await expect(
      documentsService.delete('user-1', document.id),
    ).rejects.toThrow(qdrantError);

    expect(documentsRepository.deleteByIdForUser).not.toHaveBeenCalled();
  });

  it('can retry document deletion after a transient Qdrant failure', async () => {
    const document = createDocument();
    const qdrantError = new Error('qdrant unavailable');
    documentsRepository.findByIdForUser.mockResolvedValue(document);
    qdrantService.deleteByDocumentId
      .mockRejectedValueOnce(qdrantError)
      .mockResolvedValueOnce(undefined);
    documentsRepository.deleteByIdForUser.mockResolvedValue(document);

    await expect(
      documentsService.delete('user-1', document.id),
    ).rejects.toThrow(qdrantError);
    await expect(documentsService.delete('user-1', document.id)).resolves.toBe(
      document,
    );

    expect(qdrantService.deleteByDocumentId).toHaveBeenCalledTimes(2);
    expect(documentsRepository.deleteByIdForUser).toHaveBeenCalledTimes(1);
  });

  it('propagates metadata deletion failures after Qdrant cleanup so callers can retry', async () => {
    const document = createDocument();
    const databaseError = new Error('database unavailable');
    documentsRepository.findByIdForUser.mockResolvedValue(document);
    documentsRepository.deleteByIdForUser.mockRejectedValue(databaseError);

    await expect(
      documentsService.delete('user-1', document.id),
    ).rejects.toThrow(databaseError);

    expect(qdrantService.deleteByDocumentId).toHaveBeenCalledWith(document.id);
    expect(documentsRepository.deleteByIdForUser).toHaveBeenCalledWith(
      'user-1',
      document.id,
    );
  });

  it('rejects deletion when the document does not exist for the user', async () => {
    documentsRepository.findByIdForUser.mockResolvedValue(null);

    await expect(
      documentsService.delete('user-1', 'd79d5e51-4b9e-4db8-9440-961f98d4f61a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(qdrantService.deleteByDocumentId).not.toHaveBeenCalled();
  });
});
