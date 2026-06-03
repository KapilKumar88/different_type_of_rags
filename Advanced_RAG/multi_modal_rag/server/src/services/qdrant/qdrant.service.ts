import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import type { Schemas } from '@qdrant/js-client-rest';
import { qdrantConfig } from '../../config/qdrant.config';
import type {
  ChunkPayload,
  ImageVectorPayload,
  ImageVectorPoint,
  RetrievedChunk,
  RetrievedImage,
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
  private readonly ensuredCollections = new Set<string>();

  async ensureCollection(): Promise<void> {
    await this.ensureNamedCollection(
      qdrantConfig.collectionName,
      qdrantConfig.vectorSize,
    );
  }

  private async ensureNamedCollection(
    collectionName: string,
    vectorSize: number,
  ): Promise<void> {
    if (this.ensuredCollections.has(collectionName)) {
      return;
    }

    const collection = await this.client.collectionExists(collectionName);

    if (!collection.exists) {
      await this.client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: qdrantConfig.distance,
        },
      });
      this.logger.log(`Created Qdrant collection "${collectionName}"`);
    }

    this.ensuredCollections.add(collectionName);
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
      filter: this.documentIdFilter(documentIds),
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

  async upsertImagePoints(points: ImageVectorPoint[]): Promise<void> {
    if (points.length === 0) {
      return;
    }

    await this.ensureImageCollection();
    await this.client.upsert(qdrantConfig.imageCollectionName, {
      wait: true,
      points: points.map((point) => ({
        id: point.id,
        vector: point.vector,
        payload: this.toImageQdrantPayload(point.payload),
      })),
    });
  }

  async searchImagesByDocumentIds(
    vector: number[],
    limit: number,
    documentIds: string[],
  ): Promise<RetrievedImage[]> {
    if (documentIds.length === 0) {
      return [];
    }

    await this.ensureImageCollection();
    const results = await this.client.search(qdrantConfig.imageCollectionName, {
      vector,
      limit,
      filter: this.documentIdFilter(documentIds),
      with_payload: true,
      with_vector: false,
    });
    const allowedDocumentIds = new Set(documentIds);

    return results
      .map((result) => this.toRetrievedImage(result))
      .filter((image): image is RetrievedImage => {
        return image !== null && allowedDocumentIds.has(image.documentId);
      });
  }

  async deleteImagesByDocumentId(documentId: string): Promise<void> {
    await this.ensureImageCollection();
    await this.client.delete(qdrantConfig.imageCollectionName, {
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

  private ensureImageCollection(): Promise<void> {
    return this.ensureNamedCollection(
      qdrantConfig.imageCollectionName,
      qdrantConfig.imageVectorSize,
    );
  }

  private documentIdFilter(documentIds: string[]): Schemas['Filter'] {
    return {
      must: [
        {
          key: 'documentId',
          match: { any: documentIds },
        },
      ],
    };
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

  private toImageQdrantPayload(payload: ImageVectorPayload): QdrantPayload {
    return {
      imageId: payload.imageId,
      documentId: payload.documentId,
      fileName: payload.fileName,
      pageNumber: payload.pageNumber ?? null,
      caption: payload.caption ?? null,
      source: payload.source,
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

  private toRetrievedImage(point: ScoredPointPayload): RetrievedImage | null {
    const payload = point.payload;

    if (!payload) {
      return null;
    }

    const imageId = this.getString(payload.imageId);
    const documentId = this.getString(payload.documentId);
    const fileName = this.getString(payload.fileName);
    const source = this.getString(payload.source);
    const createdAt = this.getString(payload.createdAt);

    if (!imageId || !documentId || !fileName || !source || !createdAt) {
      return null;
    }

    if (source !== 'upload' && source !== 'pdf' && source !== 'docx') {
      return null;
    }

    const image: RetrievedImage = {
      imageId,
      documentId,
      fileName,
      source,
      createdAt,
      score: point.score,
    };

    const pageNumber = this.getNumber(payload.pageNumber);

    if (pageNumber !== undefined) {
      image.pageNumber = pageNumber;
    }

    const caption = this.getString(payload.caption);

    if (caption) {
      image.caption = caption;
    }

    return image;
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
