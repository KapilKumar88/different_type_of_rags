# Task 07: Stop Generating During Streaming

## Goal

Implement IMP-05 so users can stop a long or unwanted SSE response.

## Scope

- Client streaming UI and cleanup behavior.
- Do not change the server streaming contract unless implementation proves it is required.

## Implementation Details

- Replace the disabled Send button with an active Stop button while streaming.
- Use a square/stop lucide icon if available.
- On Stop:
  - Close the active EventSource through `streamCleanupRef`.
  - Clear streaming state.
  - Mark the pending assistant message as stopped/truncated in the UI.
  - Keep the user message persisted.
- Decide during implementation whether the partial assistant response should remain local-only or be persisted through a dedicated endpoint. Prefer local-only unless a server contract is required.

## Completion Criteria

- User can stop streaming without switching conversations.
- The textarea becomes usable after stopping.
- The stopped response cannot continue appending tokens.
- Conversation switching cleanup still works.

## Test Cases

- Client build: `npm run build` from `client/`.
- Manual check: start a response, click Stop, confirm stream stops and composer unlocks.
- Manual regression: switch conversations mid-stream and confirm no stale tokens bleed into the new conversation.

## Review Gate

Stop after this task and wait for user review before starting Task 08.
