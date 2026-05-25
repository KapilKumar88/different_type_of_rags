import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { documentUploadConfig } from '../../../config/document-upload.config';
import type { Document } from '../../../database/schemas';
import { EmbeddingsService } from '../../../services/embeddings/embeddings.service';
import { QdrantService } from '../../../services/qdrant/qdrant.service';
import type { VectorPoint } from '../../../types/rag.types';
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
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
    private readonly documentParsingService: DocumentParsingService,
  ) {}

  async upload(userId: string, file: UploadedDocumentFile): Promise<Document> {
    // 1. Extract readable text from the uploaded document.
    const extractedText = await this.documentParsingService.parseDocument(
      file.originalname,
      file.mimetype,
      file.buffer,
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

    // 3. Generate embeddings for every chunk.
    const vectors = await this.embeddingsService.embedDocuments(
      chunks.map((chunk) => chunk.text),
    );

    // 4. Store each chunk embedding and its payload as one Qdrant point.
    const points: VectorPoint[] = chunks.map((chunk, index) => {
      const chunkId = randomUUID();
      const payload = {
        chunkId,
        documentId,
        fileName: file.originalname,
        text: chunk.text,
        createdAt,
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

    await this.qdrantService.upsertPoints(points);

    // 5. Persist document-level metadata for listing and deletion.
    return this.documentsRepository.create({
      id: documentId,
      userId,
      fileName: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      sizeBytes: file.size,
      chunkCount: chunks.length,
    });
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
}
