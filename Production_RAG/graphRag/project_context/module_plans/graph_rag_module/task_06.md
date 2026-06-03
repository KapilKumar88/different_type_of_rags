# Task 06: Chat Changes + Migration

## Goal
Replace vector-search retrieval with graph traversal; emit a `graph` SSE event; persist graph context on assistant messages via a new DB column.

## Scope
- `server/src/database/schemas/conversations.schema.ts` — add `graphContext jsonb`.
- Drizzle migration (generate + review).
- `server/src/api/v1/chat/chat.service.ts` — new retrieval, new prompt, new stream events.
- `server/src/api/v1/chat/chat.module.ts` — replace EmbeddingsModule/QdrantModule with GraphModule.
- `server/src/types/rag.types.ts` — add `GraphContextPayload` type used in the schema.

## Implementation Details

### conversations.schema.ts
Add to `conversationMessages`:
```ts
graphContext: jsonb('graph_context').$type<GraphContext | null>(),
```

### chat.service.ts
- Remove `embeddingsService` and `qdrantService` constructor deps; add `graphService`.
- Replace `retrieveConversationSources()` with `retrieveGraphContext()` calling `graphService.retrieveGraphContext(userId, documentIds, question)`.
- New SSE event sequence: `graph` → `sources` (chunk texts as SourceChunks) → `token`* → `done`.
  - `graph` event data: `{ entities: GraphEntity[], relationships: GraphRelationship[] }`.
  - `sources` event data: chunk texts from `GraphContext.chunks` mapped to the existing `RetrievedChunk` shape for backward compat.
- New prompt template:
```
<graph_entities>
{graphEntities}
</graph_entities>

<graph_relationships>
{graphRelationships}
</graph_relationships>

<retrieved_context>
{context}
</retrieved_context>

<conversation_history>
{history}
</conversation_history>

<latest_user_message>
{latestUserMessage}
</latest_user_message>
```
- `createMessage` call gains `graphContext: context.graphContext` field.
- Fallback (empty graph context): same path as empty sources — emit fallback answer, persist.

### chat.module.ts
Replace `EmbeddingsModule`, `QdrantModule` imports with `GraphModule`.

## Completion Criteria
- `npm run build` from `server/` passes.
- `npm test -- chat.service.spec.ts --runInBand` passes with updated mocks.
- Migration file generated and reviewed.

## Review Gate
Stop here. Wait for approval before Task 07.
