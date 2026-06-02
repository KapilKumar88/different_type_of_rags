# Task 07: Client Chat UI Integration

## Goal

Update the chat page so users can create document-tagged conversations, view saved history, switch conversations, and watch assistant responses stream in.

## Scope

- Replace local-only chat state with persisted conversation state.
- Add conversation list in the chat sidebar.
- Add a new conversation flow that requires selecting one or more documents.
- Load and render saved messages for the active conversation.
- Stream assistant tokens into the UI.
- Render source chunks from streamed `sources` and saved assistant messages.

## Implementation Details

- Use the existing documents service to fetch selectable documents.
- New conversation flow:
  - User clicks New chat.
  - User selects one or more documents.
  - Client creates the conversation.
  - Active conversation switches to the created conversation.
- Disable sending messages until an active conversation exists.
- On send:
  - Persist the user message through the message endpoint.
  - Add the user message to the UI immediately from the server response.
  - Open the SSE stream for that user message.
  - Append `token` events into a pending assistant message.
  - Replace the pending assistant message with the saved message from `done`.
- On conversation switch:
  - Close any active stream.
  - Load the selected conversation and its messages.
- Show the selected document names near the composer or conversation header.
- Keep the existing source chunk rendering behavior.

## Completion Criteria

- Users can create a conversation with selected documents.
- Users cannot start a conversation without selecting documents.
- Conversation sidebar shows saved conversations.
- Switching conversations shows persisted messages.
- Assistant answers stream incrementally.
- Sources shown in the UI belong only to the active conversation's selected documents.
- Existing layout remains usable on desktop and mobile.

## Test Cases

- Run `npm run build` from `Naive_RAG/client`.
- Create a conversation with one document and ask a question.
- Create a conversation with two documents and ask a question.
- Switch between conversations and confirm saved history reloads.
- Confirm sending is disabled without an active conversation.
- Confirm stream closes cleanly when switching conversations mid-response.

## Review Gate

After completing this task, update the lookup file, then stop unless the user explicitly approves Task 08.
