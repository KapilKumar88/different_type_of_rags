# Task 05: Client Audit Display

## Goal

Update the client to understand and display Multi-Query RAG retrieval audit metadata.

## Scope

- Update chat type definitions.
- Update SSE source event typing.
- Replace the single "Search query" audit display with generated query list display.
- Update footer/status copy from top-5 assumptions to configured/scoped wording.

Out of scope:

- New routes.
- Strategy selector.
- Visual redesign unrelated to retrieval audit.

## Implementation Details

- `RetrievalMetadata.strategy` must be `"multi_query"`.
- Render generated queries compactly and safely on mobile.
- Preserve source chunk display, retry behavior, and streaming state handling.
- Avoid nested ternary rendering in JSX.

## Completion Criteria

- Client compiles with new metadata shape.
- Chat UI shows generated search queries for streamed and persisted assistant messages.
- Existing send, stop, retry, source display, and conversation behavior remains intact.
- Module plan is updated with Task 05 status and notes.

## Test Cases

- `npm run lint` from `client/`.
- `npm run build` from `client/`.

## Review Gate

Stop after this task and wait for explicit user approval before starting Task 06.
