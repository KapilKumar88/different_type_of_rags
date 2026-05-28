# Task 08: Fix SSE Authorization And Error Leakage

## Goal

Ensure SSE answer generation validates ownership before reading messages and does not leak internal errors.

## Scope

- Confirm conversation ownership before message lookup.
- Fetch stream target messages through a user-scoped query or after validated ownership.
- Map stream errors to stable public messages/codes.

## Implementation Details

- Preserve the existing SSE event contract: `sources`, `token`, `done`, and `error`.
- Do not expose stack traces or raw dependency error messages.

## Completion Criteria

- Another user's conversation/message cannot be probed through stream errors.
- Internal errors produce stable client-safe error events.
- Tests pass.

## Test Cases

- Stream for another user's conversation returns a safe not-found error.
- Missing message returns a safe not-found error.
- LLM/Qdrant failures do not expose raw messages.

## Review Gate

Stop after this task and wait for user review before starting Task 09.

## Completion Notes

- Changed SSE answer generation to validate conversation ownership before loading the target message.
- Reused the owned conversation's document scope for stream retrieval.
- Mapped stream exceptions to stable public error payloads:
  - `not_found`: `Conversation or message not found`
  - `bad_request`: `Invalid chat stream request`
  - `stream_failed`: `Unable to stream assistant response`
- Added tests that prevent cross-user message probing and raw dependency error leakage.

## Verification

- `npm test -- chat.service.spec.ts --runInBand` from `server/` passed with `1` suite and `28` tests.
- `npm run build` from `server/` passed.
