import { BadRequestException, NotFoundException } from '@nestjs/common';
import { documentUploadConfig } from '../../../config/document-upload.config';
import type { Document } from '../../../database/schemas';
import { RagConcurrencyLimiterService } from '../../../services/rag-runtime/rag-concurrency-limiter.service';
import { GraphService } from '../graph/graph.service';
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
    buffer: Buffer.from(
      'Graph RAG builds a knowledge graph from document chunks.',
    ),
    ...overrides,
  };
}

describe('DocumentsService', () => {
  let documentsRepository: jest.Mocked<DocumentsRepository>;
  let documentParsingService: jest.Mocked<DocumentParsingService>;
  let ragConcurrencyLimiter: jest.Mocked<RagConcurrencyLimiterService>;
  let graphService: jest.Mocked<GraphService>;
  let documentsService: DocumentsService;

  beforeEach(() => {
    documentsRepository = {
      create: jest.fn(),
      findAllByUser: jest.fn(),
      findByIdForUser: jest.fn(),
      findByIdsForUser: jest.fn(),
      deleteByIdForUser: jest.fn(),
    } as unknown as jest.Mocked<DocumentsRepository>;
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
    graphService = {
      extractFromChunks: jest
        .fn()
        .mockResolvedValue([{ entities: [], relationships: [] }]),
      buildDocumentGraph: jest.fn().mockResolvedValue(undefined),
      deleteDocumentGraph: jest.fn().mockResolvedValue(undefined),
      retrieveGraphContext: jest.fn(),
      getDocumentGraph: jest.fn(),
      createChunkId: jest.fn(),
    } as unknown as jest.Mocked<GraphService>;
    documentsService = new DocumentsService(
      documentsRepository,
      documentParsingService,
      ragConcurrencyLimiter,
      graphService,
    );
  });

  it('extracts, chunks, builds graph, and saves document metadata', async () => {
    const document = createDocument();
    documentsRepository.create.mockResolvedValue(document);

    const result = await documentsService.upload('user-1', createFile());

    expect(documentParsingService.parseDocument).toHaveBeenCalledWith(
      'rag-notes.txt',
      'text/plain',
      expect.any(Buffer),
    );
    expect(graphService.extractFromChunks).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Graph RAG builds a knowledge graph from document chunks.',
        }),
      ]),
    );
    expect(graphService.buildDocumentGraph).toHaveBeenCalledWith(
      'user-1',
      expect.any(String),
      'rag-notes.txt',
      expect.any(Array),
      expect.any(Array),
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

  it('cleans up graph when metadata creation fails', async () => {
    const databaseError = new Error('database unavailable');
    documentsRepository.create.mockRejectedValue(databaseError);

    await expect(
      documentsService.upload('user-1', createFile()),
    ).rejects.toThrow(databaseError);

    expect(graphService.deleteDocumentGraph).toHaveBeenCalledWith(
      'user-1',
      expect.any(String),
    );
  });

  it('does not create metadata when graph build fails', async () => {
    const graphError = new Error('neo4j unavailable');
    graphService.buildDocumentGraph.mockRejectedValue(graphError);

    await expect(
      documentsService.upload('user-1', createFile()),
    ).rejects.toThrow(graphError);

    expect(documentsRepository.create).not.toHaveBeenCalled();
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
    expect(graphService.extractFromChunks).not.toHaveBeenCalled();
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
    expect(graphService.extractFromChunks).not.toHaveBeenCalled();
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

  it('deletes graph and metadata for an existing document', async () => {
    const document = createDocument();
    documentsRepository.findByIdForUser.mockResolvedValue(document);
    documentsRepository.deleteByIdForUser.mockResolvedValue(document);

    const result = await documentsService.delete('user-1', document.id);

    expect(documentsRepository.findByIdForUser).toHaveBeenCalledWith(
      'user-1',
      document.id,
    );
    expect(graphService.deleteDocumentGraph).toHaveBeenCalledWith(
      'user-1',
      document.id,
    );
    expect(documentsRepository.deleteByIdForUser).toHaveBeenCalledWith(
      'user-1',
      document.id,
    );
    expect(result).toBe(document);
  });

  it('does not delete metadata when graph deletion fails', async () => {
    const document = createDocument();
    const graphError = new Error('neo4j unavailable');
    documentsRepository.findByIdForUser.mockResolvedValue(document);
    graphService.deleteDocumentGraph.mockRejectedValueOnce(graphError);

    await expect(
      documentsService.delete('user-1', document.id),
    ).rejects.toThrow(graphError);

    expect(documentsRepository.deleteByIdForUser).not.toHaveBeenCalled();
  });

  it('can retry document deletion after a transient graph failure', async () => {
    const document = createDocument();
    const graphError = new Error('neo4j unavailable');
    documentsRepository.findByIdForUser.mockResolvedValue(document);
    graphService.deleteDocumentGraph
      .mockRejectedValueOnce(graphError)
      .mockResolvedValueOnce(undefined);
    documentsRepository.deleteByIdForUser.mockResolvedValue(document);

    await expect(
      documentsService.delete('user-1', document.id),
    ).rejects.toThrow(graphError);
    await expect(documentsService.delete('user-1', document.id)).resolves.toBe(
      document,
    );

    expect(graphService.deleteDocumentGraph).toHaveBeenCalledTimes(2);
    expect(documentsRepository.deleteByIdForUser).toHaveBeenCalledTimes(1);
  });

  it('propagates metadata deletion failures after graph cleanup so callers can retry', async () => {
    const document = createDocument();
    const databaseError = new Error('database unavailable');
    documentsRepository.findByIdForUser.mockResolvedValue(document);
    documentsRepository.deleteByIdForUser.mockRejectedValue(databaseError);

    await expect(
      documentsService.delete('user-1', document.id),
    ).rejects.toThrow(databaseError);

    expect(graphService.deleteDocumentGraph).toHaveBeenCalledWith(
      'user-1',
      document.id,
    );
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
    expect(graphService.deleteDocumentGraph).not.toHaveBeenCalled();
  });
});
