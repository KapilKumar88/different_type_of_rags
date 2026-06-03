# Task 05 — Parent-child retrieval in chat

## Goal
Change retrieval to match children, dedupe to parents, fetch parent text, and feed parent text to the LLM while keeping `sources` client-compatible.

## Scope
- `server/src/api/v1/chat/chat.service.ts` (+ spec)
- `server/src/api/v1/documents/documents.module.ts` (export already added in Task 04)

## Implementation Details
`retrieveConversationSources`:
1. `embedQuery` (limiter `'embedding'`).
2. `qdrant.searchByDocumentIds(vector, ragConfig.childTopK, documentIds)` (limiter `'qdrant-search'`).
3. Dedupe to unique parents preserving best-child-score order (helper `dedupeChildrenToParents`, complexity ≤15). Results are score-descending → first appearance = best child.
4. Cap at `ragConfig.parentTopK`.
5. `documentParentsRepository.findByIds(ids)` → `Map`; re-project in capped order; drop+log missing parents.
6. Build `sources` (`RetrievedChunk[]`, one per parent): `text` = parent.text, `score` = best child score, `documentId/fileName/createdAt/chunkId` from best child, `pageNumber` from parent, `parentId` = parent id.
- `formatContext` unchanged (maps `source.text`, now parent text).
- Inject `DocumentParentsRepository` into `ChatService` (via `DocumentsModule` export).

## Completion Criteria
- Build + chat specs pass.
- 3 parents, `parentTopK=2` → top-2 parents' full text appears in the prompt.

## Test Cases
- Dedupe (unique parents); score order preserved; cap at `parentTopK`; `findByIds` called with deduped ids; `sources[].text` = parent text; empty-results fallback still fires.

## Review Gate
Confirm `sources` projection (child- vs parent-sourced fields) + dedupe/cap ordering.
