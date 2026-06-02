import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { documentUploadConfig } from '../../../config/document-upload.config';
import type { Document } from '../../../database/schemas';
import { MultiVectorIndexingService } from '../../../services/multi-vector-rag/multi-vector-indexing.service';
import { QdrantService } from '../../../services/qdrant/qdrant.service';
import { RagConcurrencyLimiterService } from '../../../services/rag-runtime/rag-concurrency-limiter.service';
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
    private readonly qdrantService: QdrantService,
    private readonly multiVectorIndexingService: MultiVectorIndexingService,
    private readonly documentParsingService: DocumentParsingService,
    private readonly ragConcurrencyLimiter: RagConcurrencyLimiterService,
  ) {}

  async upload(userId: string, file: UploadedDocumentFile): Promise<Document> {
    // 1. Extract readable text from the uploaded document.
    const extractedText = await this.ragConcurrencyLimiter.run(
      'document-parsing',
      () =>
        this.documentParsingService.parseDocument(
          file.originalname,
          file.mimetype,
          file.buffer,
        ),
    );
    const text = extractedText.pages
      .map((page) => page.text)
      .join('\n')
      .trim();

    if (text.length > documentUploadConfig.maxExtractedTextCharacters) {
      throw new BadRequestException('Document text is too large to index');
    }

    if (!text) {
      throw new BadRequestException(
        'No readable text was found in the document',
      );
    }

    // 2. Split the extracted text into small overlapping chunks.
    const chunks = await splitDocumentText(extractedText);

    if (chunks.length === 0) {
      throw new BadRequestException('No text chunks could be created');
    }

    if (chunks.length > documentUploadConfig.maxChunkCount) {
      throw new BadRequestException('Document has too many chunks to index');
    }

    const createdAt = new Date().toISOString();
    const documentId = randomUUID();

    // 3. Store original, summary, and hypothetical-question vectors.
    await this.multiVectorIndexingService.indexDocument({
      documentId,
      fileName: file.originalname,
      createdAt,
      chunks,
    });

    try {
      // 4. Persist document-level metadata for listing and deletion.
      return await this.documentsRepository.create({
        id: documentId,
        userId,
        fileName: file.originalname,
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: file.size,
        chunkCount: chunks.length,
      });
    } catch (error) {
      await this.cleanupUploadedVectors(documentId);
      throw error;
    }
  }

  list(userId: string): Promise<Document[]> {
    return this.documentsRepository.findAllByUser(userId);
  }

  findByIds(userId: string, ids: string[]): Promise<Document[]> {
    return this.documentsRepository.findByIdsForUser(userId, ids);
  }

  async delete(userId: string, id: string): Promise<Document> {
    const document = await this.documentsRepository.findByIdForUser(userId, id);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.qdrantService.deleteByDocumentId(id);
    const deletedDocument = await this.documentsRepository.deleteByIdForUser(
      userId,
      id,
    );

    if (!deletedDocument) {
      throw new NotFoundException('Document not found');
    }

    return deletedDocument;
  }

  private async cleanupUploadedVectors(documentId: string): Promise<void> {
    try {
      await this.qdrantService.deleteByDocumentId(documentId);
    } catch (cleanupError) {
      this.logger.error(
        `Failed to clean up Qdrant vectors after document metadata write failure for ${documentId}`,
        cleanupError instanceof Error ? cleanupError.stack : undefined,
      );
    }
  }
}
