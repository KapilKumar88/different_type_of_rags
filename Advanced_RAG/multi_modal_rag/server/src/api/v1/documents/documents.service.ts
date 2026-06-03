import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { documentUploadConfig } from '../../../config/document-upload.config';
import type { Document, DocumentImage } from '../../../database/schemas';
import { ClipEmbeddingsService } from '../../../services/clip-embeddings/clip-embeddings.service';
import { EmbeddingsService } from '../../../services/embeddings/embeddings.service';
import { QdrantService } from '../../../services/qdrant/qdrant.service';
import { RagConcurrencyLimiterService } from '../../../services/rag-runtime/rag-concurrency-limiter.service';
import { VisionService } from '../../../services/vision/vision.service';
import type { ImageVectorPoint, VectorPoint } from '../../../types/rag.types';
import type { ParsedImage } from '../../../types/document-parsing.types';
import { DocumentImagesRepository } from './document-images.repository';
import { DocumentsRepository } from './documents.repository';
import { splitDocumentText } from './helpers/text-splitter';
import { DocumentParsingService } from '../../../services/parsing/document-parsing.service';

export type UploadedDocumentFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly documentImagesRepository: DocumentImagesRepository,
    private readonly embeddingsService: EmbeddingsService,
    private readonly clipEmbeddingsService: ClipEmbeddingsService,
    private readonly visionService: VisionService,
    private readonly qdrantService: QdrantService,
    private readonly documentParsingService: DocumentParsingService,
    private readonly ragConcurrencyLimiter: RagConcurrencyLimiterService,
  ) {}

  async upload(userId: string, file: UploadedDocumentFile): Promise<Document> {
    // 1. Extract readable text and embedded images from the uploaded document.
    const parsed = await this.ragConcurrencyLimiter.run('document-parsing', () =>
      this.documentParsingService.parseDocument(
        file.originalname,
        file.mimetype,
        file.buffer,
      ),
    );
    const text = parsed.pages
      .map((page) => page.text)
      .join('\n')
      .trim();

    if (text.length > documentUploadConfig.maxExtractedTextCharacters) {
      throw new BadRequestException('Document text is too large to index');
    }

    // 2. Split the extracted text into small overlapping chunks.
    const chunks = text ? await splitDocumentText(parsed) : [];

    if (chunks.length > documentUploadConfig.maxChunkCount) {
      throw new BadRequestException('Document has too many chunks to index');
    }

    const images = this.selectImages(parsed.images);

    if (chunks.length === 0 && images.length === 0) {
      throw new BadRequestException(
        'No readable text or images were found in the document',
      );
    }

    const createdAt = new Date().toISOString();
    const documentId = randomUUID();

    // 3. Create document metadata first so image rows can reference it (FK), then
    //    index text + images. Any failure rolls back the document (cascading image
    //    rows) and both Qdrant collections.
    const document = await this.documentsRepository.create({
      id: documentId,
      userId,
      fileName: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      sizeBytes: file.size,
      chunkCount: chunks.length,
      imageCount: images.length,
    });

    try {
      await this.indexText(documentId, file.originalname, chunks, createdAt);
      await this.indexImages(
        userId,
        documentId,
        file.originalname,
        images,
        createdAt,
      );

      return document;
    } catch (error) {
      await this.cleanupFailedUpload(userId, documentId);
      throw error;
    }
  }

  list(userId: string): Promise<Document[]> {
    return this.documentsRepository.findAllByUser(userId);
  }

  findByIds(userId: string, ids: string[]): Promise<Document[]> {
    return this.documentsRepository.findByIdsForUser(userId, ids);
  }

  getImageForUser(
    userId: string,
    imageId: string,
  ): Promise<DocumentImage | null> {
    return this.documentImagesRepository.findByIdForUser(userId, imageId);
  }

  getImagesForUser(
    userId: string,
    imageIds: string[],
  ): Promise<DocumentImage[]> {
    return this.documentImagesRepository.findByIdsForUser(userId, imageIds);
  }

  async delete(userId: string, id: string): Promise<Document> {
    const document = await this.documentsRepository.findByIdForUser(userId, id);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.qdrantService.deleteByDocumentId(id);
    await this.qdrantService.deleteImagesByDocumentId(id);
    const deletedDocument = await this.documentsRepository.deleteByIdForUser(
      userId,
      id,
    );

    if (!deletedDocument) {
      throw new NotFoundException('Document not found');
    }

    return deletedDocument;
  }

  private async indexText(
    documentId: string,
    fileName: string,
    chunks: Awaited<ReturnType<typeof splitDocumentText>>,
    createdAt: string,
  ): Promise<void> {
    if (chunks.length === 0) {
      return;
    }

    const vectors = await this.ragConcurrencyLimiter.run('embedding', () =>
      this.embeddingsService.embedDocuments(chunks.map((chunk) => chunk.text)),
    );

    const points: VectorPoint[] = chunks.map((chunk, index) => {
      const chunkId = randomUUID();
      const payload = {
        chunkId,
        documentId,
        fileName,
        text: chunk.text,
        createdAt,
        ...(chunk.pageNumber === undefined
          ? {}
          : { pageNumber: chunk.pageNumber }),
      };

      return { id: chunkId, vector: vectors[index] ?? [], payload };
    });

    await this.ragConcurrencyLimiter.run('qdrant-write', () =>
      this.qdrantService.upsertPoints(points),
    );
  }

  private async indexImages(
    userId: string,
    documentId: string,
    fileName: string,
    images: ParsedImage[],
    createdAt: string,
  ): Promise<void> {
    if (images.length === 0) {
      return;
    }

    const points: ImageVectorPoint[] = [];

    for (const image of images) {
      const caption = await this.describeImageSafely(image);
      const stored = await this.documentImagesRepository.create({
        documentId,
        userId,
        fileName,
        mimeType: image.mimeType,
        sizeBytes: image.data.length,
        width: image.width,
        height: image.height,
        pageNumber: image.pageNumber ?? null,
        source: image.source,
        caption: caption ?? null,
        data: image.data,
      });

      const vector = await this.ragConcurrencyLimiter.run('clip-embedding', () =>
        this.clipEmbeddingsService.embedImage(image.data),
      );

      points.push({
        id: randomUUID(),
        vector,
        payload: {
          imageId: stored.id,
          documentId,
          fileName,
          source: image.source,
          createdAt,
          ...(image.pageNumber === undefined
            ? {}
            : { pageNumber: image.pageNumber }),
          ...(caption ? { caption } : {}),
        },
      });
    }

    await this.ragConcurrencyLimiter.run('qdrant-image-write', () =>
      this.qdrantService.upsertImagePoints(points),
    );
  }

  /**
   * Captioning is best-effort context: a vision model failure must not block
   * ingestion, since the image is still embedded and retrievable via CLIP.
   */
  private async describeImageSafely(
    image: ParsedImage,
  ): Promise<string | undefined> {
    try {
      const caption = await this.ragConcurrencyLimiter.run(
        'image-caption',
        () =>
          this.visionService.describeImage({
            data: image.data,
            mimeType: image.mimeType,
          }),
      );

      return caption || undefined;
    } catch (error) {
      this.logger.warn(
        `Failed to caption image during ingestion: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );

      return undefined;
    }
  }

  private selectImages(images: ParsedImage[]): ParsedImage[] {
    const withinByteLimit = images.filter(
      (image) => image.data.length <= documentUploadConfig.maxImageBytes,
    );

    if (withinByteLimit.length > documentUploadConfig.maxImageCount) {
      this.logger.warn(
        `Document has ${withinByteLimit.length} images; indexing the first ${documentUploadConfig.maxImageCount}`,
      );
    }

    return withinByteLimit.slice(0, documentUploadConfig.maxImageCount);
  }

  private async cleanupFailedUpload(
    userId: string,
    documentId: string,
  ): Promise<void> {
    try {
      await this.qdrantService.deleteByDocumentId(documentId);
      await this.qdrantService.deleteImagesByDocumentId(documentId);
      await this.documentsRepository.deleteByIdForUser(userId, documentId);
    } catch (cleanupError) {
      this.logger.error(
        `Failed to clean up after document upload failure for ${documentId}`,
        cleanupError instanceof Error ? cleanupError.stack : undefined,
      );
    }
  }
}
