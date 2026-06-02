# Task 04: Chat Integration

## Goal

Refactor chat answering to delegate retrieval, answer generation, and evaluation to Self-RAG while preserving API and SSE contracts.

## Scope

- Update `ChatModule` imports.
- Refactor `ChatService` stream path.
- Preserve ownership checks, message lookup order, stable SSE errors, and persisted assistant messages.

## Implementation Details

- `sources` event still emits `{ sources, retrievalMetadata }`.
- `token` events stream the final accepted or fallback answer.
- `done` event returns the persisted assistant message.

## Completion Criteria

- Existing chat APIs remain unchanged.
- Chat service tests cover Self-RAG result persistence and stream event order.

## Test Cases

- Updated `chat.service.spec.ts`.

## Review Gate

- Continue to Task 05 because the user explicitly requested implementation of the full plan.
