# Task 04 — Parent repository + parent-child ingestion

## Goal
Rewrite ingestion to persist parents in Postgres and store children (with `parentId`) in Qdrant, wrapped so a metadata-write failure cleans up both stores.

## Scope
- `server/src/types/rag.types.ts`
- `server/src/api/v1/documents/document-parents.repository.ts` (new)
- `server/src/services/qdrant/qdrant.service.ts`
- `server/src/api/v1/documents/documents.service.ts` (+ spec)
- `server/src/api/v1/documents/documents.repository.ts`
- `server/src/api/v1/documents/documents.module.ts`

## Implementation Details
- `rag.types.ts`: add `parentId: string` to `ChunkPayload`. `RetrievedChunk = ChunkPayload & { score }` gains it automatically.
- `DocumentParentsRepository`: `createMany(rows)` and `findByIds(ids)` (empty-guard → `[]`).
- `qdrant.service.ts`: add `parentId` to `toQdrantPayload` (write) and `toRetrievedChunk` (read, reject if missing).
- `documents.service.ts upload`: split into parents → pre-generate `documentId` + per-parent `parentId` → embed children → upsert child points with `parentId` → insert parents + document row in one DB transaction (`documentsRepository.createWithParents`). On transaction failure call `cleanupUploadedVectors(documentId)`. Cap total child count against `maxChunkCount`. `chunkCount` = child count.
- `documents.module.ts`: add `DocumentParentsRepository` to `providers` **and `exports`**.

## Completion Criteria
- Build + documents specs pass.
- Upload creates `document_parents` rows; Qdrant points carry `parentId`; `chunkCount` = child count.

## Test Cases
- Parents persisted (N rows); children embedded = total children; each point payload has `parentId`; cleanup runs on DB failure.

## Review Gate
Confirm ingest ordering, transaction boundary, `chunkCount` semantics.
