import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import type { Schemas } from '@qdrant/js-client-rest';
import { qdrantConfig } from '../../config/qdrant.config';
import type {
  ChunkPayload,
  RetrievedChunk,
  SparseVector,
  SparseVectorPoint,
  VectorPoint,
} from '../../types/rag.types';

type QdrantPayload = Schemas['Payload'];
type ScoredPointPayload = Schemas['ScoredPoint'];
type CollectionInfo = Schemas['CollectionInfo'];
type QdrantFilter = Schemas['Filter'];

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

    if (!collection.exists) {
      await this.client.createCollection(qdrantConfig.collectionName, {
        vectors: {
          size: qdrantConfig.vectorSize,
          distance: qdrantConfig.distance,
        },
        sparse_vectors: {
          [qdrantConfig.sparseVectorName]: {
            modifier: 'idf',
          },
        },
      });
      await this.ensureDocumentIdPayloadIndex();
      this.logger.log(
        `Created Qdrant collection "${qdrantConfig.collectionName}"`,
      );
      return;
    }

    const collectionInfo = await this.client.getCollection(
      qdrantConfig.collectionName,
    );

    if (!this.hasSparseVector(collectionInfo)) {
      try {
        await this.client.createVectorName(
          qdrantConfig.collectionName,
          qdrantConfig.sparseVectorName,
          {
            sparse: {
              modifier: 'idf',
            },
          },
          { wait: true },
        );
        this.logger.log(
          `Added sparse vector "${qdrantConfig.sparseVectorName}" to Qdrant collection "${qdrantConfig.collectionName}"`,
        );
      } catch (error) {
        if (!this.isAlreadyExistsError(error)) {
          throw error;
        }
      }
    }

    if (!this.hasDocumentIdPayloadIndex(collectionInfo)) {
      await this.ensureDocumentIdPayloadIndex();
    }
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

  async updateSparseVectors(points: SparseVectorPoint[]): Promise<void> {
    if (points.length === 0) {
      return;
    }

    await this.ensureCollection();
    await this.client.updateVectors(qdrantConfig.collectionName, {
      wait: true,
      points: points.map((point) => ({
        id: point.id,
        vector: {
          [qdrantConfig.sparseVectorName]: point.sparseVector,
        },
      })),
    });
  }

  async searchByDocumentIds(
    vector: number[],
    limit: number,
    documentIds: string[],
  ): Promise<RetrievedChunk[]> {
    return this.searchDenseByDocumentIds(vector, limit, documentIds);
  }

  async searchDenseByDocumentIds(
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
      filter: this.createDocumentFilter(documentIds),
      with_payload: true,
      with_vector: false,
    });

    return this.toScopedRetrievedChunks(results, documentIds);
  }

  async searchSparseByDocumentIds(
    sparseVector: SparseVector,
    limit: number,
    documentIds: string[],
  ): Promise<RetrievedChunk[]> {
    if (documentIds.length === 0 || sparseVector.indices.length === 0) {
      return [];
    }

    await this.ensureCollection();
    const results = await this.client.search(qdrantConfig.collectionName, {
      vector: {
        name: qdrantConfig.sparseVectorName,
        vector: sparseVector,
      },
      limit,
      filter: this.createDocumentFilter(documentIds),
      with_payload: true,
      with_vector: false,
    });

    return this.toScopedRetrievedChunks(results, documentIds);
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
      sparseIndexed: payload.sparseIndexed ?? false,
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
    const sparseIndexed = this.getBoolean(payload.sparseIndexed);
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

    if (sparseIndexed !== undefined) {
      chunk.sparseIndexed = sparseIndexed;
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

  private getBoolean(value: unknown): boolean | undefined {
    if (typeof value !== 'boolean') {
      return undefined;
    }

    return value;
  }

  private createDocumentFilter(documentIds: string[]): QdrantFilter {
    return {
      must: [
        {
          key: 'documentId',
          match: { any: documentIds },
        },
      ],
    };
  }

  private toScopedRetrievedChunks(
    results: ScoredPointPayload[],
    documentIds: string[],
  ): RetrievedChunk[] {
    const allowedDocumentIds = new Set(documentIds);

    return results
      .map((result) => this.toRetrievedChunk(result))
      .filter((chunk): chunk is RetrievedChunk => {
        return chunk !== null && allowedDocumentIds.has(chunk.documentId);
      });
  }

  private hasSparseVector(collectionInfo: CollectionInfo): boolean {
    const sparseVectors = collectionInfo.config.params.sparse_vectors;

    if (!sparseVectors) {
      return false;
    }

    return Object.prototype.hasOwnProperty.call(
      sparseVectors,
      qdrantConfig.sparseVectorName,
    );
  }

  private hasDocumentIdPayloadIndex(collectionInfo: CollectionInfo): boolean {
    return Boolean(collectionInfo.payload_schema.documentId);
  }

  private async ensureDocumentIdPayloadIndex(): Promise<void> {
    try {
      await this.client.createPayloadIndex(qdrantConfig.collectionName, {
        wait: true,
        field_name: 'documentId',
        field_schema: 'keyword',
      });
    } catch (error) {
      if (this.isAlreadyExistsError(error)) {
        return;
      }

      throw error;
    }
  }

  private isAlreadyExistsError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    return error.message.toLowerCase().includes('already exists');
  }
}
