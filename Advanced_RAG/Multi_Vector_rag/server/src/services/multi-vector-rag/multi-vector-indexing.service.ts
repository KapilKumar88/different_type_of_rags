import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { RagConcurrencyLimiterService } from '../rag-runtime/rag-concurrency-limiter.service';
import type { VectorPoint } from '../../types/rag.types';
import { MultiVectorRepresentationService } from './multi-vector-representation.service';
import type {
  GeneratedChunkRepresentations,
  MultiVectorIndexDocumentInput,
  MultiVectorRepresentation,
  ParentTextChunk,
} from './multi-vector-rag.types';

@Injectable()
export class MultiVectorIndexingService {
  constructor(
    private readonly representationService: MultiVectorRepresentationService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
    private readonly ragConcurrencyLimiter: RagConcurrencyLimiterService,
  ) {}

  async indexDocument(input: MultiVectorIndexDocumentInput): Promise<void> {
    if (input.chunks.length === 0) {
      return;
    }

    const generatedRepresentations = await this.ragConcurrencyLimiter.run(
      'multi-vector-generation',
      () => this.representationService.generateRepresentations(input.chunks),
    );
    const representations = this.buildRepresentations(
      input.chunks,
      generatedRepresentations,
    );
    const vectors = await this.ragConcurrencyLimiter.run('embedding', () =>
      this.embeddingsService.embedDocuments(
        representations.map((representation) => representation.vectorText),
      ),
    );
    const points = this.buildVectorPoints(input, representations, vectors);

    await this.ragConcurrencyLimiter.run('qdrant-write', () =>
      this.qdrantService.upsertPoints(points),
    );
  }

  private buildRepresentations(
    chunks: ParentTextChunk[],
    generatedRepresentations: GeneratedChunkRepresentations[],
  ): MultiVectorRepresentation[] {
    const generatedByIndex = new Map(
      generatedRepresentations.map((representation) => [
        representation.chunkIndex,
        representation,
      ]),
    );

    return chunks.flatMap((chunk, chunkIndex) => {
      const generated = generatedByIndex.get(chunkIndex);

      if (!generated) {
        throw new Error(`Missing representations for chunk ${chunkIndex}`);
      }

      const chunkId = randomUUID();
      const baseRepresentation = {
        chunkId,
        parentText: chunk.text,
        ...(chunk.pageNumber === undefined
          ? {}
          : { pageNumber: chunk.pageNumber }),
      };

      return [
        {
          ...baseRepresentation,
          vectorId: randomUUID(),
          vectorType: 'original' as const,
          vectorText: chunk.text,
        },
        {
          ...baseRepresentation,
          vectorId: randomUUID(),
          vectorType: 'summary' as const,
          vectorText: generated.summary,
        },
        ...generated.questions.map((question) => ({
          ...baseRepresentation,
          vectorId: randomUUID(),
          vectorType: 'question' as const,
          vectorText: question,
        })),
      ];
    });
  }

  private buildVectorPoints(
    input: MultiVectorIndexDocumentInput,
    representations: MultiVectorRepresentation[],
    vectors: number[][],
  ): VectorPoint[] {
    return representations.map((representation, index) => {
      const payload = {
        chunkId: representation.chunkId,
        documentId: input.documentId,
        fileName: input.fileName,
        text: representation.parentText,
        vectorId: representation.vectorId,
        vectorType: representation.vectorType,
        vectorText: representation.vectorText,
        createdAt: input.createdAt,
        ...(representation.pageNumber === undefined
          ? {}
          : { pageNumber: representation.pageNumber }),
      };

      return {
        id: representation.vectorId,
        vector: vectors[index] ?? [],
        payload,
      };
    });
  }
}
