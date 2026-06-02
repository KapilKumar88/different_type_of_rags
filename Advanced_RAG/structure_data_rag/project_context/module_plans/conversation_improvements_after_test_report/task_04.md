# Task 04: Conversation Title Editing

## Goal

Implement IMP-02 so users can rename existing conversations.

## Scope

- Add server PATCH endpoint for conversation title.
- Add client service/type support.
- Add inline rename UI in the chat sidebar, with optional edit affordance in the header.

## Implementation Details

- Server:
  - Add `update-conversation.dto.ts` with Zod validation for `title`.
  - Add `PATCH /api/v1/chat/conversations/:conversationId`.
  - Ensure the conversation belongs to the current user before updating.
  - Update `title` and `updatedAt`.
  - Return the updated conversation with document IDs.
- Client:
  - Add API config and `chatService.updateConversation`.
  - Add payload/response types.
  - Add a pencil/menu rename flow in `ConversationList`.
  - Use mutation state, validation, toast errors, and cache invalidation.

## Completion Criteria

- A user can rename a conversation they own.
- Empty or too-long titles are rejected by server validation.
- Renaming updates sidebar and active conversation header.
- A user cannot rename another user's conversation.

## Test Cases

- Server tests for valid rename, invalid title, not found/not owned.
- Client build: `npm run build` from `client/`.
- Server build/tests: `npm run build` and targeted chat tests from `server/`.
- Manual check: rename active and inactive conversations.

## Review Gate

Stop after this task and wait for user review before starting Task 05.
