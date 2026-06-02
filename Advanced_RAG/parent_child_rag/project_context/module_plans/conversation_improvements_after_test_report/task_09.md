# Task 09: SSE Error Recovery and Retry

## Goal

Implement IMP-10 so streaming failures surface clearly and can be retried.

## Scope

- Client EventSource handling and retry UI.
- Keep the existing two-step flow:
  - create user message
  - stream assistant answer by `messageId`

## Implementation Details

- Update `chatService.streamMessage` to distinguish server-sent `error` events from network `EventSource.onerror`.
- On network close before `done`, notify the caller with a recoverable error state.
- In the chat UI, show a toast or inline retry action that reuses the same `messageId`.
- Limit retry attempts to a small number, such as 3, if automatic backoff is chosen.
- Prefer a user-triggered retry first because it avoids hidden duplicate assistant messages.
- Ensure retry does not create another user message.

## Completion Criteria

- A failed stream does not leave the UI stuck in streaming state.
- The user sees an actionable retry path.
- Retrying streams the answer for the same persisted user message.
- Duplicate user messages are not created during retry.

## Test Cases

- Client build: `npm run build` from `client/`.
- Manual check: simulate network interruption and confirm retry is offered.
- Manual check: retry and confirm only one user message exists.
- Regression check: normal streaming still ends through the `done` event.

## Review Gate

Stop after this task and wait for user review before starting Task 10.
