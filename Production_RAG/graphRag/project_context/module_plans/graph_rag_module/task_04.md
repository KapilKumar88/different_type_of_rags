# Task 04: Graph Domain Module

## Goal
Build the graph API module: repository (all Cypher), service (build/retrieve/visualize/delete), and controller (visualization endpoint).

## Scope
- `server/src/api/v1/graph/graph.repository.ts`
- `server/src/api/v1/graph/graph.service.ts`
- `server/src/api/v1/graph/graph.controller.ts`
- `server/src/api/v1/graph/graph.module.ts`
- `server/src/api/v1/graph/dto/document-graph-id.dto.ts`
- `server/src/app.module.ts` — import `GraphModule`.

## Implementation Details

### GraphRepository (all Cypher via Neo4jService)
- `upsertChunk(chunk)`: MERGE (:Chunk {id}) SET all properties.
- `upsertEntity(entity)`: MERGE (:Entity {userId, documentId, normalizedName}) ON CREATE SET id = ... ON MATCH SET description/type if update.
- `upsertRelationship(rel)`: MERGE (:Entity {normalizedName: source})-[:RELATED {normalizedType}]->(:Entity {normalizedName: target}) scoped by userId+documentId.
- `linkEntityToChunk(entityId, chunkId)`: MERGE (:Entity {id})-[:MENTIONED_IN]->(:Chunk {id}).
- `searchEntitiesByName(userId, documentIds, query, limit)`: full-text index call `CALL db.index.fulltext.queryNodes('entityNameIndex', $query)`.
- `traverseNeighborhood(userId, documentIds, seedEntityIds, maxHops, limit)`: variable-length path `MATCH path = (seed)-[:RELATED*1..n]-(neighbor)` filtered by documentId.
- `getChunksForEntities(userId, documentIds, entityIds)`: `MATCH (e:Entity)-[:MENTIONED_IN]->(c:Chunk)`.
- `getDocumentGraph(userId, documentId)`: all Entity and Chunk nodes + RELATED edges for the document.
- `deleteDocumentGraph(userId, documentId)`: `MATCH (n {userId, documentId}) DETACH DELETE n`.

### GraphService
- `buildDocumentGraph(userId, documentId, fileName, chunks, extractions[])`:
  - Upsert each chunk.
  - Upsert entities + relationships from each extraction result.
  - Link entities to their source chunk.
- `retrieveGraphContext(userId, documentIds, question)`:
  1. `graphExtractionService.extractFromChunk(question)` to get question entities (reuse extractor).
  2. Full-text search for seeds from step 1.
  3. Traverse neighborhood up to `graphConfig.maxHops`.
  4. Fetch chunks for all entities found.
  5. Return `GraphContext` bounded by `graphConfig.maxGraphContextCharacters`.
- `getDocumentGraph(userId, documentId)`: returns `DocumentGraph { nodes, edges }`.
- `deleteDocumentGraph(userId, documentId)`.

### GraphController
- `GET /api/v1/graph/documents/:documentId`:
  - Validates ownership via `documentsService.findByIds(userId, [documentId])`.
  - Returns `{ success, message, data: { graph: DocumentGraph } }`.

## Completion Criteria
- `npm run build` from `server/` passes.
- Controller returns 200 with `{ nodes, edges }` structure.
- No direct `process.env` access.

## Review Gate
Stop here. Show user the new files. Wait for approval before Task 05.
