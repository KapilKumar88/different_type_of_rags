# Task 08: Message Timestamps and Loading Skeleton

## Goal

Implement IMP-08 and IMP-09 to improve message readability and loading affordance.

## Scope

- Client-only UI updates in the chat route and focused helper components.
- Use existing `createdAt` values returned by the API.
- Replace the centered spinner conversation loader with message-shaped skeleton rows.

## Implementation Details

- Preserve `createdAt` when converting `ConversationMessage` to the local chat message shape.
- Render a relative timestamp beneath each message bubble.
- Keep timestamp text small and unobtrusive.
- Add a `LoadingConversation` skeleton layout with alternating left/right bubble placeholders.
- Ensure skeleton dimensions are stable and do not cause layout shift.

## Completion Criteria

- User and assistant messages show readable relative timestamps.
- Pending streaming messages handle timestamps gracefully.
- Conversation switching shows skeletons instead of only a centered spinner.
- Mobile and desktop layouts do not overflow.

## Test Cases

- Client build: `npm run build` from `client/`.
- Manual check: refresh and switch conversations; confirm timestamps render.
- Manual check: switch to a conversation with history; confirm skeleton appears while loading.

## Review Gate

Stop after this task and wait for user review before starting Task 09.
