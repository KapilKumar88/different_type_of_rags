import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { documentUploadConfig } from '../../../config/document-upload.config';
import type { Document } from '../../../database/schemas';
import { EmbeddingsService } from '../../../services/embeddings/embeddings.service';
import { QdrantService } from '../../../services/qdrant/qdrant.service';
import { SparseVectorizerService } from '../../../services/rag-retrieval/sparse-vectorizer.service';
import { RagConcurrencyLimiterService } from '../../../services/rag-runtime/rag-concurrency-limiter.service';
import type { SparseVectorPoint, VectorPoint } from '../../../types/rag.types';
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
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
    private readonly documentParsingService: DocumentParsingService,
    private readonly sparseVectorizerService: SparseVectorizerService,
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
    const sparseVectors = chunks.map((chunk) =>
      this.sparseVectorizerService.vectorize(chunk.text),
    );

    // 3. Generate embeddings for every chunk.
    const vectors = await this.ragConcurrencyLimiter.run('embedding', () =>
      this.embeddingsService.embedDocuments(chunks.map((chunk) => chunk.text)),
    );

    // 4. Store each chunk embedding and its payload as one Qdrant point.
    const points: VectorPoint[] = chunks.map((chunk, index) => {
      const chunkId = randomUUID();
      const sparseVector = sparseVectors[index];
      const payload = {
        chunkId,
        documentId,
        fileName: file.originalname,
        text: chunk.text,
        createdAt,
        sparseIndexed: sparseVector ? sparseVector.indices.length > 0 : false,
        ...(chunk.pageNumber === undefined
          ? {}
          : { pageNumber: chunk.pageNumber }),
      };

      return {
        id: chunkId,
        vector: vectors[index] ?? [],
        payload,
      };
    });
    const sparsePoints: SparseVectorPoint[] = points.flatMap((point, index) => {
      const sparseVector = sparseVectors[index];

      if (!sparseVector || sparseVector.indices.length === 0) {
        return [];
      }

      return [{ id: point.id, sparseVector }];
    });

    await this.ragConcurrencyLimiter.run('qdrant-write', () =>
      this.qdrantService.upsertPoints(points),
    );

    try {
      await this.ragConcurrencyLimiter.run('qdrant-write', () =>
        this.qdrantService.updateSparseVectors(sparsePoints),
      );
    } catch (error) {
      await this.cleanupUploadedVectors(documentId);
      throw error;
    }

    try {
      // 5. Persist document-level metadata for listing and deletion.
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
