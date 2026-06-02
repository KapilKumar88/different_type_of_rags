# Task 04: Chat Retrieval Integration

## Goal

Integrate Multi-Query RAG into the persisted, document-scoped chat flow.

## Scope

- Replace query rewriting injection/imports in chat module/service.
- Generate retrieval metadata before embedding/search.
- Embed each generated query.
- Search Qdrant only within the conversation's selected document IDs for each query.
- Deduplicate retrieved chunks by `chunkId`.
- Rank final sources by best score and limit to `RAG_TOP_K`.
- Persist and stream the new retrieval metadata shape.
- Update backend tests.

Out of scope:

- Client rendering changes.
- Schema migration, because metadata remains nullable JSONB.
- Strategy selector.

## Implementation Details

- Keep ownership validation before message lookup.
- Keep existing SSE event names: `sources`, `token`, `done`, `error`.
- Keep prompt boundaries and final answer generation based on the original user message.
- Keep no-source fallback answer behavior.
- Use existing RAG concurrency limiter for LLM generation, embeddings, Qdrant calls, and streaming.
- Prefer small helper methods for dedupe/ranking to keep complexity low.

## Completion Criteria

- Chat uses Multi-Query RAG end to end.
- Retrieved chunks are deduped and limited.
- Metadata is persisted on assistant messages.
- Backend chat tests cover query fan-out and fallback behavior.
- Module plan is updated with Task 04 status and notes.

## Test Cases

- `npm test -- chat.service.spec.ts --runInBand` from `server/`.
- `npm run build` from `server/`.

## Review Gate

Stop after this task and wait for explicit user approval before starting Task 05.
