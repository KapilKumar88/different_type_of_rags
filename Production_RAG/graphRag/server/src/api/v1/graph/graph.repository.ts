import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Neo4jService } from '../../../services/neo4j/neo4j.service';
import { normalizeEntityName } from '../../../services/graph-extraction/graph-extraction.service';
import type {
  GraphChunk,
  GraphEdge,
  GraphEntity,
  GraphNode,
  GraphRelationship,
} from '../../../types/graph.types';

@Injectable()
export class GraphRepository {
  constructor(private readonly neo4j: Neo4jService) {}

  async upsertChunk(chunk: GraphChunk): Promise<void> {
    await this.neo4j.write(
      `MERGE (c:Chunk {id: $id})
       SET c.userId = $userId,
           c.documentId = $documentId,
           c.fileName = $fileName,
           c.text = $text,
           c.pageNumber = $pageNumber,
           c.createdAt = $createdAt`,
      {
        id: chunk.id,
        userId: chunk.userId,
        documentId: chunk.documentId,
        fileName: chunk.fileName,
        text: chunk.text,
        pageNumber: chunk.pageNumber ?? null,
        createdAt: chunk.createdAt,
      },
    );
  }

  async upsertEntity(
    entity: Omit<GraphEntity, 'id'> & { id?: string },
  ): Promise<GraphEntity> {
    const id = entity.id ?? randomUUID();
    const records = await this.neo4j.write<Record<string, unknown>>(
      `MERGE (e:Entity {userId: $userId, documentId: $documentId, normalizedName: $normalizedName})
       ON CREATE SET e.id = $id,
                     e.name = $name,
                     e.type = $type,
                     e.description = $description,
                     e.createdAt = $createdAt
       ON MATCH SET  e.type = $type,
                     e.description = CASE WHEN size($description) > size(e.description) THEN $description ELSE e.description END
       RETURN e.id AS id, e.userId AS userId, e.documentId AS documentId,
              e.name AS name, e.normalizedName AS normalizedName,
              e.type AS type, e.description AS description, e.createdAt AS createdAt`,
      {
        id,
        userId: entity.userId,
        documentId: entity.documentId,
        normalizedName: entity.normalizedName,
        name: entity.name,
        type: entity.type,
        description: entity.description,
        createdAt: entity.createdAt,
      },
    );

    return records[0] as GraphEntity;
  }

  async upsertRelationship(rel: Omit<GraphRelationship, 'id'>): Promise<void> {
    const id = randomUUID();
    const normalizedType = rel.type.trim().toLowerCase().replace(/\s+/g, '_');

    await this.neo4j.write(
      `MATCH (src:Entity {userId: $userId, documentId: $documentId, normalizedName: $sourceNormalizedName})
       MATCH (tgt:Entity {userId: $userId, documentId: $documentId, normalizedName: $targetNormalizedName})
       MERGE (src)-[r:RELATED {userId: $userId, documentId: $documentId, normalizedType: $normalizedType}]->(tgt)
       ON CREATE SET r.id = $id,
                     r.type = $relType,
                     r.description = $description,
                     r.createdAt = $createdAt
       ON MATCH SET  r.description = CASE WHEN size($description) > size(r.description) THEN $description ELSE r.description END`,
      {
        id,
        userId: rel.userId,
        documentId: rel.documentId,
        sourceNormalizedName: rel.sourceNormalizedName,
        targetNormalizedName: rel.targetNormalizedName,
        normalizedType,
        relType: rel.type,
        description: rel.description,
        createdAt: rel.createdAt,
      },
    );
  }

  async linkEntityToChunk(entityId: string, chunkId: string): Promise<void> {
    await this.neo4j.write(
      `MATCH (e:Entity {id: $entityId})
       MATCH (c:Chunk {id: $chunkId})
       MERGE (e)-[:MENTIONED_IN]->(c)`,
      { entityId, chunkId },
    );
  }

  async searchEntitiesByName(
    userId: string,
    documentIds: string[],
    query: string,
    limit: number,
  ): Promise<GraphEntity[]> {
    const sanitizedQuery = query.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();

    if (!sanitizedQuery) {
      return [];
    }

    const records = await this.neo4j.read<Record<string, unknown>>(
      `CALL db.index.fulltext.queryNodes('entityNameIndex', $query)
       YIELD node AS e, score
       WHERE e.userId = $userId AND e.documentId IN $documentIds
       RETURN e.id AS id, e.userId AS userId, e.documentId AS documentId,
              e.name AS name, e.normalizedName AS normalizedName,
              e.type AS type, e.description AS description, e.createdAt AS createdAt
       ORDER BY score DESC
       LIMIT $limit`,
      { query: sanitizedQuery, userId, documentIds, limit },
    );

    return records as GraphEntity[];
  }

  async traverseNeighborhood(
    userId: string,
    documentIds: string[],
    seedEntityIds: string[],
    maxHops: number,
    limit: number,
  ): Promise<{ entities: GraphEntity[]; relationships: GraphRelationship[] }> {
    if (seedEntityIds.length === 0) {
      return { entities: [], relationships: [] };
    }

    const records = await this.neo4j.read<Record<string, unknown>>(
      `MATCH (seed:Entity)
       WHERE seed.id IN $seedEntityIds
         AND seed.userId = $userId
         AND seed.documentId IN $documentIds
       CALL apoc.path.subgraphNodes(seed, {
         relationshipFilter: 'RELATED',
         maxLevel: $maxHops,
         labelFilter: '+Entity'
       }) YIELD node AS neighbor
       WHERE neighbor.userId = $userId AND neighbor.documentId IN $documentIds
       WITH collect(DISTINCT neighbor) AS neighbors
       UNWIND neighbors AS e
       OPTIONAL MATCH (e)-[r:RELATED]->(other:Entity)
       WHERE other.userId = $userId AND other.documentId IN $documentIds
         AND other IN neighbors
       RETURN e.id AS id, e.userId AS userId, e.documentId AS documentId,
              e.name AS name, e.normalizedName AS normalizedName,
              e.type AS type, e.description AS description, e.createdAt AS createdAt,
              collect({
                id: r.id,
                userId: r.userId,
                documentId: r.documentId,
                sourceId: e.id,
                targetId: other.id,
                sourceNormalizedName: e.normalizedName,
                targetNormalizedName: other.normalizedName,
                type: r.type,
                description: r.description,
                createdAt: r.createdAt
              }) AS rels
       LIMIT $limit`,
      { seedEntityIds, userId, documentIds, maxHops, limit },
    );

    const entityMap = new Map<string, GraphEntity>();
    const relMap = new Map<string, GraphRelationship>();

    for (const rec of records) {
      const entity = rec as unknown as GraphEntity & { rels: unknown[] };

      entityMap.set(entity.id, {
        id: entity.id,
        userId: entity.userId,
        documentId: entity.documentId,
        name: entity.name,
        normalizedName: entity.normalizedName,
        type: entity.type,
        description: entity.description,
        createdAt: entity.createdAt,
      });

      for (const rel of entity.rels) {
        const r = rel as GraphRelationship;

        if (r.id) {
          relMap.set(r.id, r);
        }
      }
    }

    return {
      entities: Array.from(entityMap.values()),
      relationships: Array.from(relMap.values()),
    };
  }

  async traverseNeighborhoodSimple(
    userId: string,
    documentIds: string[],
    seedEntityIds: string[],
    maxHops: number,
    limit: number,
  ): Promise<{ entities: GraphEntity[]; relationships: GraphRelationship[] }> {
    if (seedEntityIds.length === 0) {
      return { entities: [], relationships: [] };
    }

    const entityMap = new Map<string, GraphEntity>();
    const relMap = new Map<string, GraphRelationship>();
    let frontier = seedEntityIds;

    for (let hop = 0; hop < maxHops; hop++) {
      if (frontier.length === 0) break;

      const records = await this.neo4j.read<Record<string, unknown>>(
        `MATCH (src:Entity)-[r:RELATED]->(tgt:Entity)
         WHERE src.id IN $frontier
           AND src.userId = $userId AND src.documentId IN $documentIds
           AND tgt.userId = $userId AND tgt.documentId IN $documentIds
         RETURN src.id AS srcId, src.userId AS srcUserId, src.documentId AS srcDocumentId,
                src.name AS srcName, src.normalizedName AS srcNormalizedName,
                src.type AS srcType, src.description AS srcDescription, src.createdAt AS srcCreatedAt,
                tgt.id AS tgtId, tgt.userId AS tgtUserId, tgt.documentId AS tgtDocumentId,
                tgt.name AS tgtName, tgt.normalizedName AS tgtNormalizedName,
                tgt.type AS tgtType, tgt.description AS tgtDescription, tgt.createdAt AS tgtCreatedAt,
                r.id AS relId, r.type AS relType, r.description AS relDescription,
                r.userId AS relUserId, r.documentId AS relDocumentId,
                r.createdAt AS relCreatedAt
         LIMIT $limit`,
        { frontier, userId, documentIds, limit },
      );

      const nextFrontier: string[] = [];

      for (const rec of records) {
        const r = rec as Record<string, string>;

        if (!entityMap.has(r.srcId)) {
          entityMap.set(r.srcId, {
            id: r.srcId,
            userId: r.srcUserId,
            documentId: r.srcDocumentId,
            name: r.srcName,
            normalizedName: r.srcNormalizedName,
            type: r.srcType,
            description: r.srcDescription,
            createdAt: r.srcCreatedAt,
          });
        }

        if (!entityMap.has(r.tgtId)) {
          entityMap.set(r.tgtId, {
            id: r.tgtId,
            userId: r.tgtUserId,
            documentId: r.tgtDocumentId,
            name: r.tgtName,
            normalizedName: r.tgtNormalizedName,
            type: r.tgtType,
            description: r.tgtDescription,
            createdAt: r.tgtCreatedAt,
          });
          nextFrontier.push(r.tgtId);
        }

        if (r.relId && !relMap.has(r.relId)) {
          relMap.set(r.relId, {
            id: r.relId,
            userId: r.relUserId,
            documentId: r.relDocumentId,
            sourceId: r.srcId,
            targetId: r.tgtId,
            sourceNormalizedName: r.srcNormalizedName,
            targetNormalizedName: r.tgtNormalizedName,
            type: r.relType,
            description: r.relDescription,
            createdAt: r.relCreatedAt,
          });
        }
      }

      frontier = nextFrontier;
    }

    return {
      entities: Array.from(entityMap.values()),
      relationships: Array.from(relMap.values()),
    };
  }

  async getChunksForEntities(
    userId: string,
    documentIds: string[],
    entityIds: string[],
  ): Promise<GraphChunk[]> {
    if (entityIds.length === 0) {
      return [];
    }

    const records = await this.neo4j.read<Record<string, unknown>>(
      `MATCH (e:Entity)-[:MENTIONED_IN]->(c:Chunk)
       WHERE e.id IN $entityIds
         AND c.userId = $userId AND c.documentId IN $documentIds
       RETURN DISTINCT c.id AS id, c.userId AS userId, c.documentId AS documentId,
              c.fileName AS fileName, c.text AS text,
              c.pageNumber AS pageNumber, c.createdAt AS createdAt`,
      { entityIds, userId, documentIds },
    );

    return records.map((r) => {
      const rec = r;
      const chunk: GraphChunk = {
        id: String(rec.id),
        userId: String(rec.userId),
        documentId: String(rec.documentId),
        fileName: String(rec.fileName),
        text: String(rec.text),
        createdAt: String(rec.createdAt),
      };

      if (rec.pageNumber !== null && rec.pageNumber !== undefined) {
        chunk.pageNumber = Number(rec.pageNumber);
      }

      return chunk;
    });
  }

  async getDocumentGraph(
    userId: string,
    documentId: string,
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const entityRecords = await this.neo4j.read<Record<string, unknown>>(
      `MATCH (e:Entity {userId: $userId, documentId: $documentId})
       RETURN e.id AS id, e.name AS name, e.type AS type,
              e.description AS description, e.documentId AS documentId`,
      { userId, documentId },
    );

    const edgeRecords = await this.neo4j.read<Record<string, unknown>>(
      `MATCH (src:Entity {userId: $userId, documentId: $documentId})
             -[r:RELATED {userId: $userId, documentId: $documentId}]->
             (tgt:Entity {userId: $userId, documentId: $documentId})
       RETURN r.id AS id, src.id AS sourceId, tgt.id AS targetId,
              r.type AS type, r.description AS description, r.documentId AS documentId`,
      { userId, documentId },
    );

    const nodes = entityRecords.map((r) => r as unknown as GraphNode);
    const edges = edgeRecords.map((r) => r as unknown as GraphEdge);

    return { nodes, edges };
  }

  async deleteDocumentGraph(userId: string, documentId: string): Promise<void> {
    await this.neo4j.write(
      `MATCH (n {userId: $userId, documentId: $documentId})
       DETACH DELETE n`,
      { userId, documentId },
    );
  }

  normalizeName(name: string): string {
    return normalizeEntityName(name);
  }
}
