# Task 05: Ingestion Changes

## Goal
Replace the Qdrant+embeddings ingestion path with graph extraction + Neo4j persistence.

## Scope
- `server/src/api/v1/documents/documents.service.ts` — swap steps 3–4.
- `server/src/api/v1/documents/documents.module.ts` — replace EmbeddingsModule/QdrantModule with GraphModule.
- Delete: `server/src/services/embeddings/` (both files), `server/src/services/qdrant/` (both files), `server/src/config/qdrant.config.ts`.
- `server/src/config/env.ts` — remove QDRANT_* and OLLAMA_EMBEDDING_MODEL env vars.
- `server/.env.example` — remove those entries.
- `server/src/app.module.ts` — remove QdrantModule/EmbeddingsModule if registered globally.

## Implementation Details

### documents.service.ts
New upload flow after `splitDocumentText(extractedText)`:
```
3. For each chunk, call graphExtractionService.extractFromChunk(chunk.text) via ragConcurrencyLimiter.
4. Call graphService.buildDocumentGraph(userId, documentId, file.originalname, chunks, extractions).
5. On Postgres metadata write failure: compensate by calling graphService.deleteDocumentGraph(userId, documentId).
```
Remove all references to `embeddingsService` and `qdrantService`.

### delete()
Replace `qdrantService.deleteByDocumentId(id)` with `graphService.deleteDocumentGraph(userId, id)`.

### documents.module.ts
Replace:
```ts
imports: [EmbeddingsModule, QdrantModule, DocumentParsingModule, RagRuntimeModule]
```
with:
```ts
imports: [GraphModule, DocumentParsingModule, RagRuntimeModule]
```
Export `DocumentsService` remains.

## Completion Criteria
- `npm run build` from `server/` passes with no references to embeddings or Qdrant.
- `npm test -- documents.service.spec.ts --runInBand` passes (update mocks for GraphService).
- Deleted files are gone; no dangling imports.

## Review Gate
Stop here. Wait for approval before Task 06.
