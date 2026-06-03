import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { graphConfig } from '../../../config/graph.config';
import { GraphExtractionService } from '../../../services/graph-extraction/graph-extraction.service';
import type {
  DocumentGraph,
  ExtractionResult,
  GraphChunk,
  GraphContext,
} from '../../../types/graph.types';
import { GraphRepository } from './graph.repository';

type ChunkInput = {
  id: string;
  text: string;
  pageNumber?: number;
};

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  constructor(
    private readonly graphRepository: GraphRepository,
    private readonly graphExtractionService: GraphExtractionService,
  ) {}

  async buildDocumentGraph(
    userId: string,
    documentId: string,
    fileName: string,
    chunks: ChunkInput[],
    extractions: ExtractionResult[],
  ): Promise<void> {
    const createdAt = new Date().toISOString();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const extraction = extractions[i] ?? { entities: [], relationships: [] };

      const graphChunk: GraphChunk = {
        id: chunk.id,
        userId,
        documentId,
        fileName,
        text: chunk.text,
        createdAt,
        ...(chunk.pageNumber !== undefined
          ? { pageNumber: chunk.pageNumber }
          : {}),
      };

      await this.graphRepository.upsertChunk(graphChunk);

      const entityIds: string[] = [];

      for (const extractedEntity of extraction.entities) {
        const normalizedName = this.graphRepository.normalizeName(
          extractedEntity.name,
        );

        try {
          const entity = await this.graphRepository.upsertEntity({
            userId,
            documentId,
            name: extractedEntity.name,
            normalizedName,
            type: extractedEntity.type,
            description: extractedEntity.description,
            createdAt,
          });

          entityIds.push(entity.id);
          await this.graphRepository.linkEntityToChunk(entity.id, chunk.id);
        } catch (error) {
          this.logger.warn(
            `Failed to upsert entity "${extractedEntity.name}": ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      for (const rel of extraction.relationships) {
        const sourceNormalizedName = this.graphRepository.normalizeName(
          rel.source,
        );
        const targetNormalizedName = this.graphRepository.normalizeName(
          rel.target,
        );

        try {
          await this.graphRepository.upsertRelationship({
            userId,
            documentId,
            sourceId: '',
            targetId: '',
            sourceNormalizedName,
            targetNormalizedName,
            type: rel.type,
            description: rel.description,
            createdAt,
          });
        } catch (error) {
          this.logger.warn(
            `Failed to upsert relationship "${rel.source} -> ${rel.target}": ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }

  async extractFromChunks(chunks: ChunkInput[]): Promise<ExtractionResult[]> {
    return Promise.all(
      chunks.map((chunk) =>
        this.graphExtractionService.extractFromChunk(chunk.text),
      ),
    );
  }

  async retrieveGraphContext(
    userId: string,
    documentIds: string[],
    question: string,
  ): Promise<GraphContext> {
    const questionExtraction =
      await this.graphExtractionService.extractFromChunk(question);

    const queryTerms = questionExtraction.entities.map((e) => e.name).join(' ');

    const seedEntities = await this.graphRepository.searchEntitiesByName(
      userId,
      documentIds,
      queryTerms || question,
      graphConfig.entitySeedLimit,
    );

    if (seedEntities.length === 0) {
      return { entities: [], relationships: [], chunks: [] };
    }

    const seedIds = seedEntities.map((e) => e.id);
    const { entities, relationships } =
      await this.graphRepository.traverseNeighborhoodSimple(
        userId,
        documentIds,
        seedIds,
        graphConfig.maxHops,
        graphConfig.neighborLimit,
      );

    const allEntityIds = [
      ...new Set([...seedIds, ...entities.map((e) => e.id)]),
    ];
    const chunks = await this.graphRepository.getChunksForEntities(
      userId,
      documentIds,
      allEntityIds,
    );

    const allEntities = this.dedupeById([...seedEntities, ...entities]);

    return this.boundContext({ entities: allEntities, relationships, chunks });
  }

  async getDocumentGraph(
    userId: string,
    documentId: string,
  ): Promise<DocumentGraph> {
    return this.graphRepository.getDocumentGraph(userId, documentId);
  }

  async deleteDocumentGraph(userId: string, documentId: string): Promise<void> {
    await this.graphRepository.deleteDocumentGraph(userId, documentId);
  }

  createChunkId(): string {
    return randomUUID();
  }

  private dedupeById<T extends { id: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    const result: T[] = [];

    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    }

    return result;
  }

  private boundContext(context: GraphContext): GraphContext {
    const limit = graphConfig.maxGraphContextCharacters;
    let used = 0;
    const chunks: GraphChunk[] = [];

    for (const chunk of context.chunks) {
      if (used + chunk.text.length > limit) break;

      chunks.push(chunk);
      used += chunk.text.length;
    }

    return { ...context, chunks };
  }
}
