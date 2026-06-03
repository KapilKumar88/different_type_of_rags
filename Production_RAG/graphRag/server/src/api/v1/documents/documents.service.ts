import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { documentUploadConfig } from '../../../config/document-upload.config';
import type { Document } from '../../../database/schemas';
import { RagConcurrencyLimiterService } from '../../../services/rag-runtime/rag-concurrency-limiter.service';
import { DocumentParsingService } from '../../../services/parsing/document-parsing.service';
import { GraphService } from '../graph/graph.service';
import { DocumentsRepository } from './documents.repository';
import { splitDocumentText } from './helpers/text-splitter';

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
    private readonly documentParsingService: DocumentParsingService,
    private readonly ragConcurrencyLimiter: RagConcurrencyLimiterService,
    private readonly graphService: GraphService,
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
    const textChunks = await splitDocumentText(extractedText);

    if (textChunks.length === 0) {
      throw new BadRequestException('No text chunks could be created');
    }

    if (textChunks.length > documentUploadConfig.maxChunkCount) {
      throw new BadRequestException('Document has too many chunks to index');
    }

    const documentId = randomUUID();
    const chunks = textChunks.map((chunk) => ({
      id: randomUUID(),
      text: chunk.text,
      ...(chunk.pageNumber !== undefined
        ? { pageNumber: chunk.pageNumber }
        : {}),
    }));

    // 3. Extract entities and relationships from each chunk via the LLM.
    const extractions = await this.graphService.extractFromChunks(chunks);

    // 4. Persist the knowledge graph in Neo4j.
    await this.graphService.buildDocumentGraph(
      userId,
      documentId,
      file.originalname,
      chunks,
      extractions,
    );

    try {
      // 5. Persist document-level metadata for listing and deletion.
      return await this.documentsRepository.create({
        id: documentId,
        userId,
        fileName: file.originalname,
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: file.size,
        chunkCount: textChunks.length,
      });
    } catch (error) {
      await this.cleanupDocumentGraph(userId, documentId);
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

    await this.graphService.deleteDocumentGraph(userId, id);

    const deletedDocument = await this.documentsRepository.deleteByIdForUser(
      userId,
      id,
    );

    if (!deletedDocument) {
      throw new NotFoundException('Document not found');
    }

    return deletedDocument;
  }

  private async cleanupDocumentGraph(
    userId: string,
    documentId: string,
  ): Promise<void> {
    try {
      await this.graphService.deleteDocumentGraph(userId, documentId);
    } catch (cleanupError) {
      this.logger.error(
        `Failed to clean up Neo4j graph after document metadata write failure for ${documentId}`,
        cleanupError instanceof Error ? cleanupError.stack : undefined,
      );
    }
  }
}
