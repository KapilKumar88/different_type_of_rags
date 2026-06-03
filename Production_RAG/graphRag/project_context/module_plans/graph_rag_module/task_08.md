# Task 08: Client Chat Graph Context Panel

## Goal
Show the knowledge-graph context used to generate each assistant answer in the chat UI.

## Scope
- `client/src/types/chat.types.ts` — add graph entity/relationship types + `graph` stream event.
- `client/src/services/chat.service.ts` — handle `graph` SSE event.
- `client/src/components/chat/chat-graph-context.tsx` — new collapsible panel.
- Wherever sources panel is rendered in chat messages — add the graph context panel below/alongside it.

## Implementation Details

### chat.types.ts additions
```ts
export type GraphEntity = { id: string; name: string; type: string; description: string };
export type GraphRelationship = { id: string; sourceId: string; targetId: string; type: string; description: string };
export type GraphStreamEvent = { entities: GraphEntity[]; relationships: GraphRelationship[] };
```
Extend `ChatStreamHandlers`:
```ts
onGraph?: (event: GraphStreamEvent) => void;
```
Extend `ConversationMessage`:
```ts
graphContext?: { entities: GraphEntity[]; relationships: GraphRelationship[] } | null;
```

### ChatGraphContext component
- Props: `entities: GraphEntity[]`, `relationships: GraphRelationship[]`.
- Renders a collapsible `<details>` / accordion section "Knowledge graph used".
- Lists entity pills (name + type badge) and relationship rows (source → type → target).
- Empty/null state: hidden (don't render if no entities).

### Chat page integration
- In the SSE handler: on `graph` event, store the graph payload in a ref/state alongside sources.
- On the rendered assistant message: if `message.graphContext` has entities, render `<ChatGraphContext>` below the existing Sources panel.

## Completion Criteria
- `npm run build` and `npm run lint` from `client/` pass.
- Graph panel appears in chat for messages where graph context was used.
- Panel is hidden for user messages and assistant messages with no graph context.

## Review Gate
Stop here. Wait for approval before Task 09.
