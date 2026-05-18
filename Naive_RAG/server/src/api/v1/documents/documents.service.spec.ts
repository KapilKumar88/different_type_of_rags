import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Document } from '../../../database/schemas';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService, type UploadedDocumentFile } from './documents.service';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-01T00:00:00.000Z');

function createDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'd79d5e51-4b9e-4db8-9440-961f98d4f61a',
    fileName: 'rag-notes.txt',
    mimeType: 'text/plain',
    sizeBytes: 42,
    chunkCount: 1,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

function createFile(overrides: Partial<UploadedDocumentFile> = {}): UploadedDocumentFile {
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
  let documentsService: DocumentsService;

  beforeEach(() => {
    documentsRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<DocumentsRepository>;
    embeddingsService = {
      embedDocuments: jest.fn(),
    } as unknown as jest.Mocked<EmbeddingsService>;
    qdrantService = {
      upsertPoints: jest.fn(),
      deleteByDocumentId: jest.fn(),
    } as unknown as jest.Mocked<QdrantService>;
    documentsService = new DocumentsService(
      documentsRepository,
      embeddingsService,
      qdrantService,
    );
  });

  it('extracts, chunks, embeds, stores vectors, and saves document metadata', async () => {
    const document = createDocument();
    embeddingsService.embedDocuments.mockResolvedValue([Array(768).fill(0.1)]);
    documentsRepository.create.mockResolvedValue(document);

    const result = await documentsService.upload(createFile());

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
      }),
    );
    expect(result).toBe(document);
  });

  it('rejects missing files', async () => {
    await expect(documentsService.upload(undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects documents with no readable text', async () => {
    await expect(
      documentsService.upload(createFile({ buffer: Buffer.from('   ') })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists documents from the repository', async () => {
    const documents = [createDocument()];
    documentsRepository.findAll.mockResolvedValue(documents);

    await expect(documentsService.list()).resolves.toBe(documents);
  });

  it('deletes vectors and metadata for an existing document', async () => {
    const document = createDocument();
    documentsRepository.findById.mockResolvedValue(document);
    documentsRepository.deleteById.mockResolvedValue(document);

    const result = await documentsService.delete(document.id);

    expect(qdrantService.deleteByDocumentId).toHaveBeenCalledWith(document.id);
    expect(documentsRepository.deleteById).toHaveBeenCalledWith(document.id);
    expect(result).toBe(document);
  });

  it('rejects deletion when the document does not exist', async () => {
    documentsRepository.findById.mockResolvedValue(null);

    await expect(
      documentsService.delete('d79d5e51-4b9e-4db8-9440-961f98d4f61a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(qdrantService.deleteByDocumentId).not.toHaveBeenCalled();
  });
});
