# Conversation History, Document Tagging, and Streaming Plan

## Purpose

This file is the lookup and status tracker for enhancing the existing Naive RAG module with persisted conversation history, fixed document selection per conversation, document-scoped retrieval, and streamed assistant responses.

Module scope is limited to:

- Persisted conversations and every user/assistant message.
- Multiple selected documents per conversation.
- Fixed conversation-document membership after conversation creation.
- Qdrant retrieval filtered only to the selected conversation documents.
- SSE streaming for assistant responses.
- React chat UI updates for conversation selection, document tagging, saved messages, and streaming.

Out of scope for this module:

- LangGraph.
- Agents.
- Hybrid search.
- Reranking.
- Queue-based ingestion.
- Editing the document set after a conversation is created.
- Sharing conversations between users.

## Status Legend

- `Pending`: Not started.
- `In Progress`: Implementation has started but is not ready for review.
- `Review`: Task is complete and waiting for user review.
- `Approved`: User reviewed and approved the task.

## Task Status

| Task | File | Status | Notes |
| --- | --- | --- | --- |
| Task 01: Planning and Task Files | [task_01.md](task_01.md) | Approved | User reviewed and approved proceeding to Task 02. |
| Task 02: Conversation Database Schema | [task_02.md](task_02.md) | Approved | User reviewed and approved proceeding to Task 03. |
| Task 03: Server Conversation Foundation | [task_03.md](task_03.md) | Approved | User reviewed and approved proceeding to Task 04. |
| Task 04: Scoped Retrieval and No Document Overlap | [task_04.md](task_04.md) | Approved | User reviewed and approved proceeding to Task 05. |
| Task 05: SSE Streaming and Full-History Prompting | [task_05.md](task_05.md) | Approved | User reviewed and approved proceeding to Task 06. |
| Task 06: Client API Types and Services | [task_06.md](task_06.md) | Approved | User reviewed and approved proceeding to Task 07. |
| Task 07: Client Chat UI Integration | [task_07.md](task_07.md) | Review | Updated chat UI for conversation list, document selection, persisted messages, selected document scope, streamed assistant output, and client build verification. |
| Task 08: Verification and Context Update | [task_08.md](task_08.md) | Pending | Run builds/tests, perform manual checks, and update test report. |

## Key Decisions

- Keep the existing authenticated `/api/v1` route convention.
- Keep `POST /api/v1/chat/ask` available for backward compatibility.
- Move the client chat page to the new conversation API.
- Conversations can include multiple selected documents.
- Conversation document membership is locked after creation.
- Store all user and assistant messages in Postgres.
- Include all stored messages for a conversation in the prompt.
- Always filter vector search by the selected document IDs for the conversation.
- Use SSE for assistant response streaming.
- Use a two-step streaming flow:
  - `POST /api/v1/chat/conversations/:id/messages`
  - `GET /api/v1/chat/conversations/:id/messages/:messageId/stream`
- SSE event types are `sources`, `token`, `done`, and `error`.

## Target API

- `GET /api/v1/chat/conversations`
- `POST /api/v1/chat/conversations`
- `GET /api/v1/chat/conversations/:id`
- `POST /api/v1/chat/conversations/:id/messages`
- `GET /api/v1/chat/conversations/:id/messages/:messageId/stream`

Non-streaming endpoints must keep the standard response shape:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

## Strict Workflow

- Always read this lookup file before starting or resuming this module.
- Always read the current task file before implementing that task.
- Complete tasks in numeric order.
- After completing a task, update this lookup file with the task status and notes.
- Do not implement future tasks early unless the user explicitly asks to continue without review gates.
- Do not add LangGraph, agents, hybrid search, reranking, or queues in this module.

## Completion Summary

- Task 01 is approved.
- Task 02 is approved.
- Task 03 is approved.
- Task 04 is approved.
- Task 05 is approved.
- Task 06 is approved.
- Task 07 is ready for review.
- Server implementation now includes database schema, migration, conversation endpoints, scoped retrieval safeguards, and SSE answer streaming.
- Client implementation now includes conversation API contracts, service methods, reusable EventSource stream helper, and conversation-aware chat UI.
