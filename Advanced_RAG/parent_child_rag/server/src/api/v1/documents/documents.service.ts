import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { documentUploadConfig } from '../../../config/document-upload.config';
import type { Document } from '../../../database/schemas';
import type { NewDocumentParent } from '../../../database/schemas';
import { EmbeddingsService } from '../../../services/embeddings/embeddings.service';
import { QdrantService } from '../../../services/qdrant/qdrant.service';
import { RagConcurrencyLimiterService } from '../../../services/rag-runtime/rag-concurrency-limiter.service';
import type { VectorPoint } from '../../../types/rag.types';
import { DocumentsRepository } from './documents.repository';
import { splitDocumentIntoParents } from './helpers/text-splitter';
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
    const fullText = extractedText.pages
      .map((page) => page.text)
      .join('\n')
      .trim();

    if (fullText.length > documentUploadConfig.maxExtractedTextCharacters) {
      throw new BadRequestException('Document text is too large to index');
    }

    if (!fullText) {
      throw new BadRequestException(
        'No readable text was found in the document',
      );
    }

    // 2. Split text into parent chunks; each parent is re-split into children.
    const parents = await splitDocumentIntoParents(extractedText);

    if (parents.length === 0) {
      throw new BadRequestException('No text chunks could be created');
    }

    const allChildren = parents.flatMap((p) => p.children);

    // chunkCount tracks the number of embedded child vectors (the retrieval unit).
    if (allChildren.length > documentUploadConfig.maxChunkCount) {
      throw new BadRequestException('Document has too many chunks to index');
    }

    const createdAt = new Date().toISOString();
    const documentId = randomUUID();

    // 3. Pre-generate a stable parentId for each parent before any I/O.
    const parentIds = parents.map(() => randomUUID());

    // 4. Build the Postgres parent rows.
    const parentRows: NewDocumentParent[] = parents.map((parent, i) => ({
      id: parentIds[i],
      documentId,
      parentIndex: parent.parentIndex,
      text: parent.text,
      ...(parent.pageNumber !== undefined
        ? { pageNumber: parent.pageNumber }
        : {}),
    }));

    // 5. Embed all child chunks and upsert as Qdrant points.
    const childTexts = allChildren.map((c) => c.text);
    const vectors = await this.ragConcurrencyLimiter.run('embedding', () =>
      this.embeddingsService.embedDocuments(childTexts),
    );

    // Build child points: each child carries its parent's id in the payload.
    const points: VectorPoint[] = [];
    let childIndex = 0;

    for (let pi = 0; pi < parents.length; pi++) {
      const parent = parents[pi];
      const parentId = parentIds[pi] as string;

      for (const child of parent.children) {
        const chunkId = randomUUID();
        points.push({
          id: chunkId,
          vector: vectors[childIndex] ?? [],
          payload: {
            chunkId,
            documentId,
            parentId,
            fileName: file.originalname,
            text: child.text,
            createdAt,
            ...(child.pageNumber !== undefined
              ? { pageNumber: child.pageNumber }
              : {}),
          },
        });
        childIndex++;
      }
    }

    await this.ragConcurrencyLimiter.run('qdrant-write', () =>
      this.qdrantService.upsertPoints(points),
    );

    // 6. Persist parent rows + document metadata in a single transaction.
    // On failure, clean up the already-upserted child vectors.
    try {
      return await this.documentsRepository.createWithParents(
        {
          id: documentId,
          userId,
          fileName: file.originalname,
          mimeType: file.mimetype || 'application/octet-stream',
          sizeBytes: file.size,
          chunkCount: allChildren.length,
        },
        parentRows,
      );
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
