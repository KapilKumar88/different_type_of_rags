# Task 03: Graph Types and Extraction Service

## Goal
Define shared graph types and an LLM-based entity/relationship extraction service.

## Scope
- `server/src/types/graph.types.ts` — all graph domain types.
- `server/src/config/graph.config.ts` — extraction/retrieval config constants.
- `server/src/config/env.ts` — add graph env vars.
- `server/src/services/graph-extraction/graph-extraction.service.ts`
- `server/src/services/graph-extraction/graph-extraction.module.ts`

## Implementation Details

### graph.types.ts
```ts
export type ExtractedEntity = { name: string; type: string; description: string };
export type ExtractedRelationship = { source: string; target: string; type: string; description: string };
export type ExtractionResult = { entities: ExtractedEntity[]; relationships: ExtractedRelationship[] };

export type GraphEntity = { id: string; userId: string; documentId: string; name: string; normalizedName: string; type: string; description: string; createdAt: string };
export type GraphRelationship = { id: string; userId: string; documentId: string; sourceId: string; targetId: string; type: string; description: string; createdAt: string };
export type GraphChunk = { id: string; userId: string; documentId: string; fileName: string; text: string; pageNumber?: number; createdAt: string };

export type GraphContext = { entities: GraphEntity[]; relationships: GraphRelationship[]; chunks: GraphChunk[] };
export type DocumentGraph = { nodes: GraphNode[]; edges: GraphEdge[] };
export type GraphNode = { id: string; name: string; type: string; description: string; documentId: string };
export type GraphEdge = { id: string; sourceId: string; targetId: string; type: string; description: string; documentId: string };
```

### graph.config.ts env vars
```
GRAPH_MAX_HOPS: z.coerce.number().int().positive().default(2)
GRAPH_ENTITY_SEED_LIMIT: z.coerce.number().int().positive().default(5)
GRAPH_NEIGHBOR_LIMIT: z.coerce.number().int().positive().default(20)
GRAPH_MAX_CONTEXT_CHARACTERS: z.coerce.number().int().positive().default(6000)
GRAPH_MAX_ENTITIES_PER_CHUNK: z.coerce.number().int().positive().default(8)
GRAPH_MAX_RELATIONSHIPS_PER_CHUNK: z.coerce.number().int().positive().default(10)
```

### GraphExtractionService
- Injects `LlmService` + `RagConcurrencyLimiterService`.
- `extractFromChunk(chunkText: string): Promise<ExtractionResult>`:
  - Builds a strict JSON-only extraction prompt (zero prose, JSON object only in reply).
  - Calls `llmService.generateAnswer(prompt)` inside `ragConcurrencyLimiter.run('graph-extraction', ...)`.
  - Strips markdown code fences if present, then `JSON.parse`.
  - Zod-validates the result; on failure returns `{ entities: [], relationships: [] }` and logs a warning.
  - Caps entities to `graphConfig.maxEntitiesPerChunk` and relationships to `graphConfig.maxRelationshipsPerChunk`.
  - Normalizes names: `name.trim().toLowerCase()` for deduplication keys.

## Completion Criteria
- `npm run build` from `server/` passes.
- `GraphExtractionService` is injectable.
- Extraction prompt is safe: system prompt tells model to output only JSON, no instructions from chunk text can override it.

## Review Gate
Stop here. Show user the files. Wait for approval before Task 04.
