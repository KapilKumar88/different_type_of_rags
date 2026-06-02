import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import type { Schemas } from '@qdrant/js-client-rest';
import { qdrantConfig } from '../../config/qdrant.config';
import type {
  ChunkPayload,
  RagVectorType,
  RetrievedChunk,
  RetrievedVectorMatch,
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
      chunkId: payload.chunkId,
      documentId: payload.documentId,
      fileName: payload.fileName,
      text: payload.text,
      vectorId: payload.vectorId ?? null,
      vectorType: payload.vectorType ?? null,
      vectorText: payload.vectorText ?? null,
      pageNumber: payload.pageNumber ?? null,
      createdAt: payload.createdAt,
    };
  }

  private toRetrievedChunk(point: ScoredPointPayload): RetrievedChunk | null {
    const payload = point.payload;

    if (!payload) {
      return null;
    }

    const chunkId = this.getString(payload.chunkId);
    const documentId = this.getString(payload.documentId);
    const fileName = this.getString(payload.fileName);
    const text = this.getString(payload.text);
    const createdAt = this.getString(payload.createdAt);

    if (!chunkId || !documentId || !fileName || !text || !createdAt) {
      return null;
    }

    const pageNumber = this.getNumber(payload.pageNumber);
    const vectorType = this.getVectorType(payload.vectorType);
    const vectorText = this.getString(payload.vectorText) ?? text;
    const vectorId = this.getString(payload.vectorId) ?? chunkId;
    const match: RetrievedVectorMatch = {
      vectorId,
      vectorType,
      vectorText,
      score: point.score,
    };
    const chunk: RetrievedChunk = {
      chunkId,
      documentId,
      fileName,
      text,
      vectorId,
      vectorType,
      vectorText,
      createdAt,
      score: point.score,
      bestMatchType: vectorType,
      matches: [match],
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

  private getVectorType(value: unknown): RagVectorType {
    if (
      value === 'original' ||
      value === 'summary' ||
      value === 'question'
    ) {
      return value;
    }

    return 'original';
  }
}
