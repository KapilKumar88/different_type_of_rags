# Task 06: Add RAG Abuse Controls

## Goal

Limit expensive RAG operations per user/IP and prevent runaway concurrency.

## Scope

- Add throttling to upload, message creation, SSE streaming, and ask/scope endpoints.
- Add concurrency limits around embedding, parsing, vector search, and LLM streaming.
- Add global request/body limits where appropriate.

## Implementation Details

- Use Nest throttler patterns already used by auth where possible.
- Return stable `429` responses.

## Completion Criteria

- Expensive endpoints have explicit abuse controls.
- Tests cover rate-limited requests.

## Test Cases

- Excess upload requests return `429`.
- Excess stream starts return `429`.
- Normal authenticated usage still works.

## Review Gate

Stop after this task and wait for user review before starting Task 07.

## Completion Notes

- Added `ragRateLimitConfig` backed by typed environment values for upload, chat mutation, SSE stream, and runtime concurrency limits.
- Added `.env.example` entries for the new RAG abuse-control settings.
- Applied Nest throttler guards/decorators to:
  - `POST /api/v1/documents/upload`
  - `POST /api/v1/chat/conversations`
  - `PATCH /api/v1/chat/conversations/:conversationId/documents`
  - `POST /api/v1/chat/conversations/:conversationId/messages`
  - `GET /api/v1/chat/conversations/:conversationId/messages/:messageId/stream`
- Added `RagConcurrencyLimiterService` and wrapped document parsing, embeddings, Qdrant writes/searches, and LLM streaming with in-process concurrency limits that return `429` when saturated.
- Added tests for route throttle metadata and concurrency-limit `429` behavior.
- Verification passed:
  - `npm run build`
  - `npm test -- chat.controller.spec.ts documents.controller.spec.ts rag-concurrency-limiter.service.spec.ts chat.service.spec.ts documents.service.spec.ts --runInBand`
