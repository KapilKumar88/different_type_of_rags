# Task 03: Server Conversation Foundation

## Goal

Add the backend repository, service, DTOs, and controller endpoints needed to create, list, fetch, and persist messages for conversations.

## Scope

- Add chat DTOs for conversation creation, route params, and user messages.
- Add repository methods for conversation CRUD and message persistence.
- Add service methods for authenticated conversation access.
- Add controller endpoints for non-streaming conversation operations.
- Keep existing `POST /api/v1/chat/ask` working.

## Implementation Details

- Add request validation with Zod:
  - Create conversation: optional `title`, required non-empty `documentIds`.
  - Create message: required non-empty `content`.
  - Params: UUID validation for `conversationId` and `messageId`.
- Add endpoints:
  - `GET /api/v1/chat/conversations`
  - `POST /api/v1/chat/conversations`
  - `GET /api/v1/chat/conversations/:id`
  - `POST /api/v1/chat/conversations/:id/messages`
- Use `@CurrentUser()` and the existing global JWT guard.
- Ensure users can only access conversations where `conversation.userId` matches the authenticated user.
- Return selected document IDs and saved messages when fetching a conversation.
- When creating a user message, persist it before any streaming response starts.

## Completion Criteria

- Conversations can be created with selected documents.
- Conversations can be listed for the authenticated user.
- A single conversation can be fetched with selected documents and messages.
- User messages are saved in `conversation_messages`.
- Unauthorized cross-user access returns `404` or `403`; prefer `404` to avoid leaking IDs.
- Existing stateless chat endpoint still works.

## Test Cases

- Run `npm run build` from `Naive_RAG/server`.
- Add service tests for conversation creation with multiple document IDs.
- Add service tests for fetching messages in chronological order.
- Add service tests for rejecting access to another user's conversation.
- Test that `POST /api/v1/chat/ask` remains unchanged.

## Review Gate

After completing this task, update the lookup file, then stop unless the user explicitly approves Task 04.
