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
import { RagConcurrencyLimiterService } from '../../../services/rag-runtime/rag-concurrency-limiter.service';
import type { DocumentContentKind, VectorPoint } from '../../../types/rag.types';
import { DocumentsRepository } from './documents.repository';
import { splitDocumentText } from './helpers/text-splitter';
import { DocumentParsingService } from '../../../services/parsing/document-parsing.service';
import {
  StructuredDocumentsRepository,
  type CreateStructuredTableInput,
  type StructuredTableWithColumns,
  type StructuredTableWithRows,
} from './structured-documents.repository';
import { tableToSearchText } from '../../../services/parsing/helpers/structured-table.helpers';

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
    private readonly structuredDocumentsRepository: StructuredDocumentsRepository,
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
    const parsedStructuredTables = extractedText.structuredTables ?? [];
    const text = extractedText.pages
      .map((page) => page.text)
      .join('\n')
      .trim();

    if (text.length > documentUploadConfig.maxExtractedTextCharacters) {
      throw new BadRequestException('Document text is too large to index');
    }

    if (!text && parsedStructuredTables.length === 0) {
      throw new BadRequestException(
        'No readable text or structured data was found in the document',
      );
    }

    // 2. Split the extracted text into small overlapping chunks.
    const chunks = text ? await splitDocumentText(extractedText) : [];

    if (chunks.length === 0 && parsedStructuredTables.length === 0) {
      throw new BadRequestException('No text chunks could be created');
    }

    if (chunks.length > documentUploadConfig.maxChunkCount) {
      throw new BadRequestException('Document has too many chunks to index');
    }

    this.validateStructuredTables(parsedStructuredTables);

    const createdAt = new Date().toISOString();
    const documentId = randomUUID();
    const contentKind = this.getContentKind(text, parsedStructuredTables.length);
    const structuredRowCount = parsedStructuredTables.reduce(
      (total, table) => total + table.rows.length,
      0,
    );
    const document = await this.documentsRepository.create({
      id: documentId,
      userId,
      fileName: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      sizeBytes: file.size,
      chunkCount: chunks.length,
      contentKind,
      structuredTableCount: parsedStructuredTables.length,
      structuredRowCount,
    });

    try {
      const structuredTables =
        parsedStructuredTables.length === 0
          ? []
          : await this.structuredDocumentsRepository.createTables(
              this.toStructuredTableRows(documentId, parsedStructuredTables),
            );
      const points = await this.createVectorPoints({
        documentId,
        fileName: file.originalname,
        createdAt,
        chunks,
        structuredTables,
      });

      await this.ragConcurrencyLimiter.run('qdrant-write', () =>
        this.qdrantService.upsertPoints(points),
      );

      return document;
    } catch (error) {
      await this.cleanupUploadedVectors(documentId);
      await this.cleanupUploadedDocument(userId, documentId);
      throw error;
    }
  }

  list(userId: string): Promise<Document[]> {
    return this.documentsRepository.findAllByUser(userId);
  }

  findByIds(userId: string, ids: string[]): Promise<Document[]> {
    return this.documentsRepository.findByIdsForUser(userId, ids);
  }

  findStructuredTables(
    userId: string,
    documentId: string,
  ): Promise<StructuredTableWithRows[]> {
    return this.structuredDocumentsRepository.findTablesByDocumentForUser(
      userId,
      documentId,
    );
  }

  findStructuredTablesByDocumentIds(
    documentIds: string[],
  ): Promise<StructuredTableWithRows[]> {
    return this.structuredDocumentsRepository.findTablesByDocuments(documentIds);
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

  private async cleanupUploadedDocument(
    userId: string,
    documentId: string,
  ): Promise<void> {
    try {
      await this.documentsRepository.deleteByIdForUser(userId, documentId);
    } catch (cleanupError) {
      this.logger.error(
        `Failed to clean up document metadata after upload failure for ${documentId}`,
        cleanupError instanceof Error ? cleanupError.stack : undefined,
      );
    }
  }

  private validateStructuredTables(
    tables: Awaited<ReturnType<DocumentParsingService['parseDocument']>>['structuredTables'],
  ): void {
    if (tables.length > documentUploadConfig.maxStructuredTableCount) {
      throw new BadRequestException('Document has too many tables to index');
    }

    const rowCount = tables.reduce((total, table) => total + table.rows.length, 0);

    if (rowCount > documentUploadConfig.maxStructuredRowCount) {
      throw new BadRequestException('Document has too many structured rows to index');
    }

    const hasTooManyColumns = tables.some(
      (table) => table.columns.length > documentUploadConfig.maxStructuredColumnCount,
    );

    if (hasTooManyColumns) {
      throw new BadRequestException('Document has too many structured columns to index');
    }
  }

  private getContentKind(
    text: string,
    structuredTableCount: number,
  ): DocumentContentKind {
    if (text && structuredTableCount > 0) {
      return 'hybrid';
    }

    return structuredTableCount > 0 ? 'structured' : 'text';
  }

  private toStructuredTableRows(
    documentId: string,
    tables: Awaited<ReturnType<DocumentParsingService['parseDocument']>>['structuredTables'],
  ): CreateStructuredTableInput[] {
    return tables.map((table) => ({
      table: {
        documentId,
        tableKey: table.tableKey,
        title: table.title,
        sourceType: table.sourceType,
        sourceLabel: table.sourceLabel,
        pageNumber: table.pageNumber,
        rowCount: table.rows.length,
        columnCount: table.columns.length,
      },
      columns: table.columns.map((column) => ({
        columnKey: column.key,
        name: column.name,
        columnIndex: column.index,
        valueType: column.valueType,
        nonNullCount: column.nonNullCount,
        sampleValues: column.sampleValues,
      })),
      rows: table.rows.map((row) => ({
        rowIndex: row.index,
        values: row.values,
      })),
    }));
  }

  private async createVectorPoints(input: {
    documentId: string;
    fileName: string;
    createdAt: string;
    chunks: Awaited<ReturnType<typeof splitDocumentText>>;
    structuredTables: StructuredTableWithColumns[];
  }): Promise<VectorPoint[]> {
    const searchableItems = [
      ...input.chunks.map((chunk) => ({
        kind: 'text' as const,
        text: chunk.text,
        pageNumber: chunk.pageNumber,
      })),
      ...input.structuredTables.map((table) => ({
        kind: 'table_summary' as const,
        text: tableToSearchText({
          tableKey: table.tableKey,
          title: table.title,
          sourceType: table.sourceType,
          sourceLabel: table.sourceLabel,
          pageNumber: table.pageNumber ?? undefined,
          columns: table.columns.map((column) => ({
            key: column.columnKey,
            name: column.name,
            index: column.columnIndex,
            valueType: column.valueType,
            nonNullCount: column.nonNullCount,
            sampleValues: column.sampleValues,
          })),
          rows: [],
        }),
        table,
      })),
    ];

    if (searchableItems.length === 0) {
      return [];
    }

    const vectors = await this.ragConcurrencyLimiter.run('embedding', () =>
      this.embeddingsService.embedDocuments(searchableItems.map((item) => item.text)),
    );

    return searchableItems.map((item, index): VectorPoint => {
      const chunkId = randomUUID();
      const basePayload = {
        kind: item.kind,
        chunkId,
        documentId: input.documentId,
        fileName: input.fileName,
        text: item.text,
        createdAt: input.createdAt,
      };

      if (item.kind === 'text') {
        return {
          id: chunkId,
          vector: vectors[index] ?? [],
          payload: {
            ...basePayload,
            ...(item.pageNumber === undefined ? {} : { pageNumber: item.pageNumber }),
          },
        };
      }

      return {
        id: chunkId,
        vector: vectors[index] ?? [],
        payload: {
          ...basePayload,
          tableId: item.table.id,
          tableKey: item.table.tableKey,
          tableTitle: item.table.title,
          sourceType: item.table.sourceType,
          rowCount: item.table.rowCount,
          columnCount: item.table.columnCount,
          ...(item.table.pageNumber === null ? {} : { pageNumber: item.table.pageNumber }),
        },
      };
    });
  }
}
