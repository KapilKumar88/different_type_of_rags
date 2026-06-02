# Task 05: Frontend Types, Stream, and UI Trace

## Goal

Update the client to receive the `hops` SSE event, attach it to the assistant message in state, persist it through conversation load, and render a collapsible "Reasoning steps" panel in the chat UI.

## Scope

- `client/src/types/chat.types.ts` — add `MultiHopStep`, `HopsStreamEvent`, update `ChatStreamHandlers` and `ConversationMessage`.
- `client/src/types/chat-ui.types.ts` — add `hops` field to `ChatMessage`.
- `client/src/services/chat.service.ts` — add `hops` EventSource listener.
- `client/src/routes/app.chat.tsx` — handle `onHops` in streamMessage, carry hops through `toChatMessage`.
- `client/src/components/chat/message-display.tsx` — add `ReasoningTrace` component, update `MessageRow`.

## Implementation Details

### chat.types.ts

```ts
export type MultiHopStepKind = 'sub-question' | 'follow-up';

export type MultiHopStep = {
  hopNumber: number;
  kind: MultiHopStepKind;
  query: string;
  retrievedChunkIds: string[];
  newChunkCount: number;
};

export type HopsStreamEvent = {
  hops: MultiHopStep[];
};
```

Add `onHops?: (event: HopsStreamEvent) => void` to `ChatStreamHandlers`.

Add to `ConversationMessage`:
```ts
metadata?: { hops?: MultiHopStep[] } | null;
```

### chat-ui.types.ts

```ts
hops?: MultiHopStep[];
```

### chat.service.ts

After the `sources` listener, add:
```ts
eventSource.addEventListener('hops', (event) => {
  handlers.onHops?.(parseStreamEvent<HopsStreamEvent>(event));
});
```

### app.chat.tsx

In `streamMessage` handlers block add:
```ts
onHops: ({ hops }) => {
  setMessages((current) =>
    current.map((message) =>
      message.id === pendingId ? { ...message, hops } : message,
    ),
  );
},
```

In `toChatMessage` (the function that maps `ConversationMessage` to `ChatMessage`):
```ts
hops: message.metadata?.hops ?? undefined,
```

### message-display.tsx

Add a `ReasoningTrace` component before `SourceChunks` in `MessageRow`:

```tsx
{!isUser && message.hops && message.hops.length > 0 && (
  <ReasoningTrace hops={message.hops} />
)}
```

`ReasoningTrace` renders a collapsible `<details>` (matching the `SourceChunks` style):
- Summary label: `Reasoning steps ({hops.length})` with a `GitBranch` icon.
- Each hop row: hop number badge, `sub-question`/`follow-up` label badge, query text, and `+{newChunkCount} chunks` annotation.

Also update the footer label in `app.chat.tsx` (around line 683) from `"Scoped RAG · top 5 chunks"` to `"Multi-Hop RAG · up to 8 context chunks"` when multi-hop is enabled (or just change the static string since it is always enabled by default).

## Completion Criteria

- `hops` event is received by the stream client and attached to the assistant message.
- After reloading a conversation, `toChatMessage` carries `hops` from `message.metadata?.hops`.
- The `ReasoningTrace` component renders for assistant messages that have hops.
- The `ReasoningTrace` is hidden for messages with no hops (user messages, fallback answers).
- `npm run build` from `client/` passes.
- `npm run lint` from `client/` passes with no new errors.

## Test Cases

- Run `npm run build` from `client/`.
- Run `npm run lint` from `client/`.
- Confirm `ReasoningTrace` renders correctly with a mock `hops` prop.

## Review Gate

After completing this task, update `multi_hop_rag_module_plan.md` task status to `Review`, then stop and wait for user approval before starting Task 06.
