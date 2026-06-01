# Task 05: Client Audit Display

## Goal

Update the client to receive, persist in UI state, and display rewritten retrieval query audit metadata.

## Scope

- Update chat response and stream event types.
- Update stream parsing so pending assistant messages receive retrieval metadata with sources.
- Map persisted `retrievalMetadata` through `toChatMessage`.
- Add compact UI near retrieved sources showing the search query.
- Keep messages without retrieval metadata rendering normally.

Out of scope:

- Backend behavior changes.
- New endpoints.
- Major chat layout redesign.

## Implementation Details

- Extend `ConversationMessage` and `ChatMessage` with nullable/optional retrieval metadata.
- Update the `onSources` handler to apply both sources and retrieval metadata to the pending assistant message.
- Display metadata only for assistant messages when `retrievalMetadata` exists.
- Keep UI compact and consistent with the existing source chunk display.

## Completion Criteria

- Live streamed messages show the rewritten search query once sources arrive.
- Reloaded persisted messages show the same metadata.
- Existing messages without metadata do not show empty placeholders.
- Module plan is updated with Task 05 status and notes.

## Test Cases

- TypeScript build verifies stream event and message type compatibility.
- Manual/component inspection confirms metadata display is conditional.
- Client lint/build pass with only known existing warnings if any.

## Review Gate

Stop after this task and wait for explicit user approval before starting Task 06.
