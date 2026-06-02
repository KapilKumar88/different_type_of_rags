# Task 04: Wire into ChatService and Module

## Goal

Integrate `MultiHopRetrieverService` into the chat flow: inject it into `ChatService`, emit the `hops` SSE event, persist the hop trace, update the synthesis prompt, and register the service in `ChatModule`.

## Scope

- `server/src/api/v1/chat/chat.service.ts` — inject retriever, route retrieval, emit hops event, persist metadata.
- `server/src/api/v1/chat/chat.module.ts` — add `MultiHopRetrieverService` as a provider.
- `server/src/services/rag-runtime/rag-runtime.module.ts` — no change needed (MultiHopRetrieverService is in ChatModule providers, not RagRuntimeModule).

## Implementation Details

### chat.service.ts changes

1. **Add import** for `MultiHopRetrieverService`, `MultiHopResult`, `MultiHopStep`, `ragConfig`.

2. **Extend types**:
```ts
export type ConversationAnswerContext = {
  conversation: ConversationWithDocumentIds;
  sources: RetrievedChunk[];
  hops: MultiHopStep[];
};

export type ChatStreamEventType = 'sources' | 'token' | 'done' | 'error' | 'hops';
```

3. **Replace `retrieveConversationSources`** with a new private method `retrieveForConversation` that returns `MultiHopResult`:
```ts
private async retrieveForConversation(
  conversation: ConversationWithDocumentIds,
  question: string,
): Promise<MultiHopResult>
```
- If `ragConfig.multiHop.enabled` → delegate to `this.multiHopRetriever.retrieve(question, conversation.documentIds)`.
- Else → use existing single-hop path and return `{ sources, hops: [] }`.

4. **Update `streamConversationAnswer`**:
- After retrieval, emit `this.createStreamEvent('hops', { hops })` immediately after the `sources` event.
- In the `createMessage` call for the assistant response, include `metadata: { hops }`.
- Same for the fallback path (`persistAndStreamFallback`): accept hops and persist them.

5. **Update `buildConversationPrompt`** to accept `hops: MultiHopStep[]` and insert a `<research_steps>` block between `<retrieved_context>` and `<conversation_history>` showing the hop queries (not the chunk text):
```
<research_steps>
{researchSteps}
</research_steps>
```
Where `researchSteps` is formatted as:
```
Step 1 (sub-question): How did X affect Y?
Step 2 (follow-up): What was the outcome of Y on Z?
```
This block is bounded and treated as content (not instructions).

6. **Update `getConversationAnswerContext`** to return hops in the result.

### chat.module.ts change

Add `MultiHopRetrieverService` to the `providers` array. The required imports (`EmbeddingsModule`, `LlmModule`, `QdrantModule`, `RagRuntimeModule`) are already present.

```ts
import { MultiHopRetrieverService } from '../../../services/rag-runtime/multi-hop-retriever.service';
// ...
providers: [ChatService, ChatRepository, MultiHopRetrieverService],
```

## Completion Criteria

- `ChatService` constructor includes `MultiHopRetrieverService`.
- SSE stream emits a `hops` event (type `'hops'`, data `{ hops: MultiHopStep[] }`) for every answer.
- Assistant messages are persisted with `metadata: { hops }`.
- When `RAG_MULTI_HOP_ENABLED=false`, a `hops` event is still emitted (with empty array), and sources + answer behavior is identical to the naive baseline.
- `npm run build` from `server/` passes.
- `npm test -- chat.service.spec.ts --runInBand` passes.

## Test Cases

- Run `npm test -- chat.service.spec.ts --runInBand` from `server/`.
- Run `npm run build` from `server/`.
- Run `npm test -- --runInBand` from `server/` and confirm all existing tests still pass.

## Review Gate

After completing this task, update `multi_hop_rag_module_plan.md` task status to `Review`, then stop and wait for user approval before starting Task 05.
