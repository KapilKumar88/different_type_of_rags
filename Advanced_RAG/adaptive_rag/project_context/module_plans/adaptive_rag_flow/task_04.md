# Task 04: Chat API Integration

## Goal

Wire the Adaptive RAG runtime into the existing chat answer stream while preserving the current API surface and safety guarantees.

## Scope

- Refactor `ChatService` so stream answering delegates adaptive orchestration to the runtime service.
- Preserve conversation ownership checks before message lookup.
- Preserve selected-document scoping.
- Emit adaptive trace metadata through SSE.
- Persist assistant messages with sources and adaptive trace.
- Update server chat tests for adaptive behavior.
- Add or update Swagger documentation if the project has Swagger decorators on this surface.

## Implementation Details

- Keep existing `sources`, `token`, `done`, and `error` stream events.
- Add an `adaptive_trace` event before token streaming once the trace is available.
- Continue to emit stable public stream errors:
  - `not_found`
  - `bad_request`
  - `stream_failed`
- Ensure retries still operate on the same persisted user message ID.
- Keep fallback persistence behavior for no-source and failed-validation cases.
- Split complex helpers out of `ChatService` if cognitive complexity approaches the project limit.

## Completion Criteria

- Existing chat endpoint routes are unchanged.
- Existing client can still receive a valid answer even before client trace UI changes.
- Server chat tests cover trace emission and persistence.
- Module plan task status and notes are updated.

## Test Cases

- Focused chat service tests from `server/`.
- Focused chat controller tests from `server/`.
- `npm run build` from `server/`.

## Review Gate

Stop after Task 04 and ask the user for review before client UI work.

## Completion Notes

- Imported `AdaptiveRagModule` into `ChatModule`.
- Updated `ChatService.streamConversationAnswer()` to delegate answering to `AdaptiveRagService`.
- Preserved existing chat stream endpoint and `sources`, `token`, `done`, and `error` events.
- Added `adaptive_trace` SSE emission before token streaming.
- Persisted assistant messages with `sources` and `adaptiveTrace`.
- Updated chat service tests for adaptive delegation, trace emission, fallback persistence, and stable runtime errors.
- Verified:
  - `npm test -- chat.service.spec.ts --runInBand`
  - `npm test -- chat.controller.spec.ts --runInBand`
  - `npm run build`
