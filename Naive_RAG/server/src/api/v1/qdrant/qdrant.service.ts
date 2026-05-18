import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { qdrantConfig } from '../../../config/qdrant.config';
import type {
  ChunkPayload,
  RetrievedChunk,
  VectorPoint,
} from '../../../types/rag.types';

type QdrantPayloadValue = string | number | boolean | null;

type QdrantPayload = Record<string, QdrantPayloadValue | QdrantPayloadValue[]>;

type ScoredPointPayload = {
  payload?: QdrantPayload | null;
  score: number;
};

@Injectable()
export class QdrantService {
  private readonly logger = new Logger(QdrantService.name);
  private readonly client = new QdrantClient({ url: qdrantConfig.url });

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

  async search(vector: number[], limit: number): Promise<RetrievedChunk[]> {
    await this.ensureCollection();
    const results = await this.client.search(qdrantConfig.collectionName, {
      vector,
      limit,
      with_payload: true,
      with_vector: false,
    });

    return results
      .map((result) => this.toRetrievedChunk(result as ScoredPointPayload))
      .filter((chunk): chunk is RetrievedChunk => chunk !== null);
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
    const chunk: RetrievedChunk = {
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
}
