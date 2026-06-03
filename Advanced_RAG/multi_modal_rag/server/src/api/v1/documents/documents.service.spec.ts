import { BadRequestException, NotFoundException } from '@nestjs/common';
import { documentUploadConfig } from '../../../config/document-upload.config';
import type { Document, DocumentImage } from '../../../database/schemas';
import { ClipEmbeddingsService } from '../../../services/clip-embeddings/clip-embeddings.service';
import { EmbeddingsService } from '../../../services/embeddings/embeddings.service';
import { QdrantService } from '../../../services/qdrant/qdrant.service';
import { RagConcurrencyLimiterService } from '../../../services/rag-runtime/rag-concurrency-limiter.service';
import { VisionService } from '../../../services/vision/vision.service';
import type {
  ParsedDocument,
  ParsedImage,
} from '../../../types/document-parsing.types';
import { DocumentImagesRepository } from './document-images.repository';
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
    imageCount: 0,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

function createImage(overrides: Partial<DocumentImage> = {}): DocumentImage {
  return {
    id: 'img-1',
    documentId: 'd79d5e51-4b9e-4db8-9440-961f98d4f61a',
    userId: 'user-1',
    fileName: 'diagram.png',
    mimeType: 'image/png',
    sizeBytes: 1024,
    width: 256,
    height: 256,
    pageNumber: null,
    source: 'upload',
    caption: null,
    data: Buffer.from('image-bytes'),
    createdAt,
    ...overrides,
  };
}

function parsedImage(overrides: Partial<ParsedImage> = {}): ParsedImage {
  return {
    data: Buffer.from('image-bytes'),
    mimeType: 'image/png',
    width: 256,
    height: 256,
    source: 'upload',
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
  let documentImagesRepository: jest.Mocked<DocumentImagesRepository>;
  let embeddingsService: jest.Mocked<EmbeddingsService>;
  let clipEmbeddingsService: jest.Mocked<ClipEmbeddingsService>;
  let visionService: jest.Mocked<VisionService>;
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
    documentImagesRepository = {
      create: jest.fn(),
      findByIdForUser: jest.fn(),
      findByIdsForUser: jest.fn(),
    } as unknown as jest.Mocked<DocumentImagesRepository>;
    embeddingsService = {
      embedDocuments: jest.fn(),
    } as unknown as jest.Mocked<EmbeddingsService>;
    clipEmbeddingsService = {
      embedImage: jest.fn(),
      embedText: jest.fn(),
    } as unknown as jest.Mocked<ClipEmbeddingsService>;
    visionService = {
      describeImage: jest.fn(),
    } as unknown as jest.Mocked<VisionService>;
    qdrantService = {
      upsertPoints: jest.fn(),
      upsertImagePoints: jest.fn(),
      deleteByDocumentId: jest.fn(),
      deleteImagesByDocumentId: jest.fn(),
    } as unknown as jest.Mocked<QdrantService>;
    documentParsingService = {
      isSupportedDocument: jest.fn(),
      validateDocumentFileType: jest.fn(),
      parseDocument: jest.fn(
        async (
          _fileName: string,
          _mimeType: string | undefined,
          buffer: Buffer,
        ): Promise<ParsedDocument> => ({
          pages: [{ text: buffer.toString('utf8') }],
          images: [],
        }),
      ),
    } as unknown as jest.Mocked<DocumentParsingService>;
    ragConcurrencyLimiter = {
      run: jest.fn(async (_key, task: () => Promise<unknown>) => task()),
    } as unknown as jest.Mocked<RagConcurrencyLimiterService>;
    documentsService = new DocumentsService(
      documentsRepository,
      documentImagesRepository,
      embeddingsService,
      clipEmbeddingsService,
      visionService,
      qdrantService,
      documentParsingService,
      ragConcurrencyLimiter,
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
        imageCount: 0,
        userId: 'user-1',
      }),
    );
    expect(qdrantService.upsertImagePoints).not.toHaveBeenCalled();
    expect(result).toBe(document);
  });

  it('keeps parser page numbers on vector payloads', async () => {
    const document = createDocument();
    documentParsingService.parseDocument.mockResolvedValue({
      pages: [{ text: 'Page specific text', pageNumber: 4 }],
      images: [],
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

  it('embeds, stores, and indexes standalone image uploads', async () => {
    const document = createDocument({
      fileName: 'diagram.png',
      mimeType: 'image/png',
      chunkCount: 0,
      imageCount: 1,
    });
    documentParsingService.parseDocument.mockResolvedValue({
      pages: [],
      images: [parsedImage()],
    });
    documentsRepository.create.mockResolvedValue(document);
    visionService.describeImage.mockResolvedValue('A system architecture diagram');
    documentImagesRepository.create.mockResolvedValue(createImage());
    clipEmbeddingsService.embedImage.mockResolvedValue(Array(512).fill(0.3));

    const result = await documentsService.upload(
      'user-1',
      createFile({ originalname: 'diagram.png', mimetype: 'image/png' }),
    );

    expect(embeddingsService.embedDocuments).not.toHaveBeenCalled();
    expect(documentImagesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        mimeType: 'image/png',
        source: 'upload',
        caption: 'A system architecture diagram',
      }),
    );
    expect(clipEmbeddingsService.embedImage).toHaveBeenCalled();
    expect(qdrantService.upsertImagePoints).toHaveBeenCalledWith([
      expect.objectContaining({
        vector: Array(512).fill(0.3),
        payload: expect.objectContaining({
          imageId: 'img-1',
          source: 'upload',
          caption: 'A system architecture diagram',
        }),
      }),
    ]);
    expect(result).toBe(document);
  });

  it('still indexes images when captioning fails', async () => {
    const document = createDocument({ chunkCount: 0, imageCount: 1 });
    documentParsingService.parseDocument.mockResolvedValue({
      pages: [],
      images: [parsedImage()],
    });
    documentsRepository.create.mockResolvedValue(document);
    visionService.describeImage.mockRejectedValue(new Error('vision down'));
    documentImagesRepository.create.mockResolvedValue(
      createImage({ caption: null }),
    );
    clipEmbeddingsService.embedImage.mockResolvedValue(Array(512).fill(0.3));

    await documentsService.upload('user-1', createFile());

    expect(documentImagesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ caption: null }),
    );
    expect(qdrantService.upsertImagePoints).toHaveBeenCalled();
  });

  it('rolls back the document and vectors when indexing fails', async () => {
    const document = createDocument();
    const embeddingError = new Error('embedding unavailable');
    documentsRepository.create.mockResolvedValue(document);
    embeddingsService.embedDocuments.mockRejectedValue(embeddingError);

    await expect(
      documentsService.upload('user-1', createFile()),
    ).rejects.toThrow(embeddingError);

    const createdId = documentsRepository.create.mock.calls[0]?.[0].id;
    expect(createdId).toEqual(expect.any(String));
    expect(qdrantService.deleteByDocumentId).toHaveBeenCalledWith(createdId);
    expect(qdrantService.deleteImagesByDocumentId).toHaveBeenCalledWith(
      createdId,
    );
    expect(documentsRepository.deleteByIdForUser).toHaveBeenCalledWith(
      'user-1',
      createdId,
    );
  });

  it('rejects documents with no readable text or images', async () => {
    documentParsingService.parseDocument.mockResolvedValue({
      pages: [{ text: '   ' }],
      images: [],
    });

    await expect(
      documentsService.upload(
        'user-1',
        createFile({ buffer: Buffer.from('   ') }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(documentsRepository.create).not.toHaveBeenCalled();
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

  it('returns a stored image only within the user scope', async () => {
    const image = createImage();
    documentImagesRepository.findByIdForUser.mockResolvedValue(image);

    await expect(
      documentsService.getImageForUser('user-1', image.id),
    ).resolves.toBe(image);
    expect(documentImagesRepository.findByIdForUser).toHaveBeenCalledWith(
      'user-1',
      image.id,
    );
  });

  it('deletes text vectors, image vectors, and metadata for an existing document', async () => {
    const document = createDocument();
    documentsRepository.findByIdForUser.mockResolvedValue(document);
    documentsRepository.deleteByIdForUser.mockResolvedValue(document);

    const result = await documentsService.delete('user-1', document.id);

    expect(qdrantService.deleteByDocumentId).toHaveBeenCalledWith(document.id);
    expect(qdrantService.deleteImagesByDocumentId).toHaveBeenCalledWith(
      document.id,
    );
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
