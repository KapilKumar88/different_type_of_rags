# Task 06: Client API Types and Services

## Goal

Add the client-side types, endpoint configuration, services, and SSE helper needed for conversation-based chat.

## Scope

- Extend API endpoint config for conversation routes.
- Add or update chat-related client types.
- Add chat service methods for conversations and messages.
- Add a small streaming helper around `EventSource`.
- Keep existing auth and documents services unchanged.

## Implementation Details

- Add client types:
  - `Conversation`
  - `ConversationMessage`
  - `CreateConversationPayload`
  - `CreateMessagePayload`
  - `ConversationListResponse`
  - `ConversationDetailsResponse`
  - `CreateMessageResponse`
  - SSE event payload types for `sources`, `token`, `done`, and `error`
- Add service methods:
  - `listConversations()`
  - `createConversation(payload)`
  - `getConversation(id)`
  - `createMessage(conversationId, payload)`
  - `streamMessage(conversationId, messageId, handlers)`
- Use `EventSource` with credentials support where the browser and endpoint origin require cookies.
- Close the stream on `done`, `error`, component unmount, or conversation switch.
- Preserve the existing `ask()` service method only for backward compatibility.

## Completion Criteria

- Client TypeScript types match the planned API response shapes.
- Client services call the new endpoints.
- Streaming helper can append tokens and surface errors.
- Existing document list/upload/delete calls still compile.
- Existing auth calls still compile.

## Test Cases

- Run `npm run build` from `Naive_RAG/client`.
- Confirm TypeScript catches invalid conversation payloads.
- Confirm stream helper closes the `EventSource` after `done`.
- Confirm service methods use `apiConfig.baseUrl` consistently.

## Review Gate

After completing this task, update the lookup file, then stop unless the user explicitly approves Task 07.
