# Task 05: Editable Conversation Document Scope

## Goal

Implement IMP-03 so a user can add or remove documents in an existing conversation at any point without creating a new chat.

## Scope

- Add server endpoint to replace a conversation's document scope.
- Add client "Edit scope" flow in the conversation header.
- Reuse the existing document picker behavior where practical.
- Preserve existing messages; do not clone or recreate the conversation.

## Implementation Details

- Server:
  - Add `update-conversation-documents.dto.ts` with `documentIds` validation.
  - Add `PATCH /api/v1/chat/conversations/:conversationId/documents`.
  - Validate ownership and selected document existence.
  - Deduplicate document IDs and require at least one document.
  - In a transaction, delete old `conversation_documents` rows and insert the new set.
  - Update conversation `updatedAt`.
  - Return the updated conversation with document IDs.
- Client:
  - Add `chatService.updateConversationDocuments`.
  - Add "Edit scope" button in `ConversationHeader`.
  - Open a document picker preselected with the active conversation documents.
  - Allow adding and removing documents, but disable save when no document is selected.
  - Show a warning that future answers use the new document scope while previous answers remain historical.
  - On success, invalidate conversation list and active conversation details.

## Completion Criteria

- The active conversation document badges update after saving scope changes.
- Future retrieval is filtered to the updated document IDs.
- Existing messages remain visible.
- The UI does not create a new chat during scope editing.
- Removing all documents is blocked.

## Test Cases

- Server tests for adding, removing, deduping, empty list rejection, invalid document IDs, and not-owned conversation.
- Client build: `npm run build` from `client/`.
- Manual check: add a document to an existing chat, ask about the new document, confirm sources can include it.
- Manual check: remove a document, ask about removed content, confirm sources do not include the removed document.

## Review Gate

Stop after this task and wait for user review before starting Task 06.
