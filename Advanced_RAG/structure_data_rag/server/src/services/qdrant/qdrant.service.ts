import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import type { Schemas } from '@qdrant/js-client-rest';
import { qdrantConfig } from '../../config/qdrant.config';
import type {
  ChunkPayload,
  RetrievedChunk,
  RetrievedTableSummary,
  RetrievedTextChunk,
  VectorPoint,
} from '../../types/rag.types';

type QdrantPayload = Schemas['Payload'];
type ScoredPointPayload = Schemas['ScoredPoint'];

@Injectable()
export class QdrantService {
  private readonly logger = new Logger(QdrantService.name);
  private readonly client = new QdrantClient({
    url: qdrantConfig.url,
    checkCompatibility: false,
  });

  async ensureCollection(): Promise<void> {
    const collection = await this.client.collectionExists(
      qdrantConfig.collectionName,
    );

    if (collection.exists) {
      return;
    }

    await this.client.createCollection(qdrantConfig.collectionName, {
      vectors: {
        size: qdrantConfig.vectorSize,
        distance: qdrantConfig.distance,
      },
    });
    this.logger.log(
      `Created Qdrant collection "${qdrantConfig.collectionName}"`,
    );
  }

  async upsertPoints(points: VectorPoint[]): Promise<void> {
    if (points.length === 0) {
      return;
    }

    await this.ensureCollection();
    await this.client.upsert(qdrantConfig.collectionName, {
      wait: true,
      points: points.map((point) => ({
        id: point.id,
        vector: point.vector,
        payload: this.toQdrantPayload(point.payload),
      })),
    });
  }

  async searchByDocumentIds(
    vector: number[],
    limit: number,
    documentIds: string[],
  ): Promise<RetrievedChunk[]> {
    if (documentIds.length === 0) {
      return [];
    }

    await this.ensureCollection();
    const results = await this.client.search(qdrantConfig.collectionName, {
      vector,
      limit,
      filter: {
        must: [
          {
            key: 'documentId',
            match: { any: documentIds },
          },
        ],
      },
      with_payload: true,
      with_vector: false,
    });
    const allowedDocumentIds = new Set(documentIds);

    return results
      .map((result) => this.toRetrievedChunk(result))
      .filter((chunk): chunk is RetrievedChunk => {
        return chunk !== null && allowedDocumentIds.has(chunk.documentId);
      });
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    await this.ensureCollection();
    await this.client.delete(qdrantConfig.collectionName, {
      wait: true,
      filter: {
        must: [
          {
            key: 'documentId',
            match: { value: documentId },
          },
        ],
      },
    });
  }

  private toQdrantPayload(payload: ChunkPayload): QdrantPayload {
    return {
      kind: payload.kind,
      chunkId: payload.chunkId,
      documentId: payload.documentId,
      fileName: payload.fileName,
      text: payload.text,
      pageNumber: payload.pageNumber ?? null,
      tableId: payload.tableId ?? null,
      tableKey: payload.tableKey ?? null,
      tableTitle: payload.tableTitle ?? null,
      sourceType: payload.sourceType ?? null,
      rowCount: payload.rowCount ?? null,
      columnCount: payload.columnCount ?? null,
      createdAt: payload.createdAt,
    };
  }

  private toRetrievedChunk(point: ScoredPointPayload): RetrievedChunk | null {
    const payload = point.payload;

    if (!payload) {
      return null;
    }

    const chunkId = this.getString(payload.chunkId);
    const kind = this.getString(payload.kind) ?? 'text';
    const documentId = this.getString(payload.documentId);
    const fileName = this.getString(payload.fileName);
    const text = this.getString(payload.text);
    const createdAt = this.getString(payload.createdAt);

    if (!chunkId || !documentId || !fileName || !text || !createdAt) {
      return null;
    }

    const pageNumber = this.getNumber(payload.pageNumber);
    if (kind === 'table_summary') {
      const tableId = this.getString(payload.tableId);
      const tableKey = this.getString(payload.tableKey);
      const tableTitle = this.getString(payload.tableTitle);
      const sourceType = this.getString(payload.sourceType);
      const rowCount = this.getNumber(payload.rowCount);
      const columnCount = this.getNumber(payload.columnCount);

      if (
        !tableId ||
        !tableKey ||
        !tableTitle ||
        !this.isStructuredSourceType(sourceType) ||
        rowCount === undefined ||
        columnCount === undefined
      ) {
        return null;
      }

      const tableSummary: RetrievedTableSummary = {
        kind: 'table_summary',
        chunkId,
        documentId,
        fileName,
        text,
        createdAt,
        tableId,
        tableKey,
        tableTitle,
        sourceType,
        rowCount,
        columnCount,
        score: point.score,
      };

      if (pageNumber !== undefined) {
        tableSummary.pageNumber = pageNumber;
      }

      return tableSummary;
    }

    const chunk: RetrievedTextChunk = {
      kind: 'text',
      chunkId,
      documentId,
      fileName,
      text,
      createdAt,
      score: point.score,
    };

    if (pageNumber !== undefined) {
      chunk.pageNumber = pageNumber;
    }

    return chunk;
  }

  private getString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    return value;
  }

  private getNumber(value: unknown): number | undefined {
    if (typeof value !== 'number') {
      return undefined;
    }

    return value;
  }

  private isStructuredSourceType(
    value: string | null,
  ): value is RetrievedTableSummary['sourceType'] {
    return (
      value === 'csv' ||
      value === 'xlsx' ||
      value === 'json' ||
      value === 'markdown' ||
      value === 'docx' ||
      value === 'pdf'
    );
  }
}
