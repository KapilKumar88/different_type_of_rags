# Task 06: Conversation Delete Flow

## Goal

Implement IMP-04 with a conversation delete flow so the sidebar does not grow indefinitely.

## Scope

- Hard delete conversations owned by the current user.
- Rely on existing cascade behavior for `conversation_documents` and `conversation_messages`.
- Do not implement archive unless the user approves a soft-delete schema addition.

## Implementation Details

- Server:
  - Add `DELETE /api/v1/chat/conversations/:conversationId`.
  - Validate ownership before deletion.
  - Return the deleted conversation summary.
- Client:
  - Add `chatService.deleteConversation`.
  - Add a sidebar item menu with Delete.
  - Confirm before deleting.
  - If the active conversation is deleted, select the next available conversation or show empty state.
  - Invalidate conversation list and remove stale conversation details from cache.

## Completion Criteria

- Users can delete conversations they own.
- Deleted conversations disappear from the sidebar.
- Associated messages and document join rows are removed by FK cascade.
- Deleting one conversation does not delete documents.
- A user cannot delete another user's conversation.

## Test Cases

- Server tests for successful delete and not-owned/not-found delete.
- Client build: `npm run build` from `client/`.
- Manual check: delete active conversation and confirm the UI lands on a valid state.
- Manual check: confirm source documents remain in the Documents page.

## Review Gate

Stop after this task and wait for user review before starting Task 07.
