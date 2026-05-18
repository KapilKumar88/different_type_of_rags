# Task 05: SSE Streaming and Full-History Prompting

## Goal

Stream assistant responses over SSE while storing complete conversation history and using all previous messages in the prompt.

## Scope

- Add `LlmService.streamAnswer()`.
- Add SSE endpoint for message streaming.
- Build prompts from retrieved context plus all stored conversation messages.
- Persist assistant messages after the stream completes.
- Emit source, token, done, and error events.

## Implementation Details

- Add endpoint:
  - `GET /api/v1/chat/conversations/:conversationId/messages/:messageId/stream`
- Use NestJS `@Sse()` and return an RxJS observable of `MessageEvent` values.
- Stream protocol:
  - `sources`: emitted once after retrieval, before tokens.
  - `token`: emitted for each assistant text chunk.
  - `done`: emitted after the assistant message is persisted.
  - `error`: emitted if retrieval, prompting, or model streaming fails.
- The stream endpoint must:
  - Confirm the conversation belongs to the authenticated user.
  - Confirm `messageId` is a user message in that conversation.
  - Load the conversation's fixed document IDs.
  - Retrieve chunks using scoped Qdrant search.
  - Load all messages in chronological order.
  - Build the prompt with retrieved context and full conversation history.
- If scoped retrieval returns no chunks, persist and stream the configured fallback answer.
- If the LLM returns an empty answer, persist and stream the configured fallback answer.

## Completion Criteria

- Assistant text streams incrementally to the client.
- Assistant messages are saved once streaming completes.
- Sources are attached to the saved assistant message.
- Full conversation history is included in the prompt.
- Empty scoped retrieval returns the fallback answer without calling the LLM.
- Stream failures produce an `error` SSE event and do not crash the server.

## Test Cases

- Run `npm run build` from `Naive_RAG/server`.
- Unit test that prompt text includes previous user and assistant messages.
- Unit test that no-source retrieval emits fallback and stores an assistant message.
- Unit test that streamed tokens are combined into the saved assistant content.
- Unit test that the stream rejects message IDs outside the conversation.

## Review Gate

After completing this task, update the lookup file, then stop unless the user explicitly approves Task 06.
