# Task 05: Client Adaptive Trace Integration

## Goal

Expose adaptive response metadata in the chat UI without disrupting the existing conversation, source, streaming, stop, and retry flows.

## Scope

- Extend client chat types for adaptive trace metadata.
- Update `chatService.streamMessage()` to handle `adaptive_trace` SSE events.
- Store trace metadata on pending and completed assistant chat messages.
- Display a compact adaptive trace panel below assistant messages.
- Keep UI state local to the chat route and message components unless cross-route state becomes necessary.

## Implementation Details

- Display concise status such as:
  - route decision
  - retrieval attempts
  - whether a rewrite was used
  - number of relevant chunks
  - answer validation result
  - fallback reason when applicable
- Do not show raw prompts, hidden grader text, or long diagnostic payloads.
- Use existing UI primitives, icons, badges, and details disclosure patterns.
- Keep text fitting within message width on mobile and desktop.
- Preserve TanStack Query for server state and local React state for transient stream state.

## Completion Criteria

- Client builds and lints.
- Chat UI handles messages with and without adaptive trace.
- Existing source display, retry, stop, and copy actions still work.
- Module plan task status and notes are updated.

## Test Cases

- `npm run lint` from `client/`.
- `npm run build` from `client/`.
- Manual UI smoke if backend/runtime services are available.

## Review Gate

Stop after Task 05 and ask the user for review before final verification.

## Completion Notes

- Added client adaptive trace types alongside existing chat/source types.
- Added `adaptive_trace` SSE handling in `chatService.streamMessage()`.
- Stored adaptive trace metadata on pending assistant messages during streaming and on completed persisted messages.
- Added a compact assistant-message trace panel showing route, rewrite use, retrieval attempts, relevant chunk counts, answer validation status, and fallback reason.
- Verified:
  - `npm run lint` from `client/` passed with existing Fast Refresh warnings only.
  - `npm run build` from `client/` passed.
