# Conversation Improvements After Test Report Plan

## Purpose

This file is the lookup and status tracker for the improvement items selected from:

`project_context/module_plans/add_conversation_history_tag_documents/test_report.md`

The selected improvement scope is:

- IMP-01: Refresh document queries after uploads from the app header.
- IMP-02: Allow conversation title editing.
- IMP-03: Allow adding and removing documents in an existing conversation without creating a new chat.
- IMP-04: Add conversation deletion. Archive is documented as a follow-up decision unless soft-delete behavior is explicitly approved.
- IMP-05: Add a Stop Generating control during SSE streaming.
- IMP-07: Generate more descriptive multi-document conversation titles.
- IMP-08: Show message timestamps.
- IMP-09: Replace spinner-only message loading with a skeleton layout.
- IMP-10: Add SSE reconnection/error recovery.

Out of scope for this follow-up module:

- IMP-06 header search/command palette.
- LangGraph, agents, hybrid search, reranking, or queue-based ingestion.
- Sharing conversations between users.
- Re-indexing documents.

## Status Legend

- `Pending`: Not started.
- `In Progress`: Implementation has started but is not ready for review.
- `Review`: Task is complete and waiting for user review.
- `Approved`: User reviewed and approved the task.

## Task Status

| Task | File | Status | Improvement IDs | Notes |
| --- | --- | --- | --- | --- |
| Task 01: Planning and Review Gates | [task_01.md](task_01.md) | Approved | All selected IMPs | User reviewed the follow-up plan and approved implementation. |
| Task 02: Header Upload Document Refresh | [task_02.md](task_02.md) | Approved | IMP-01 | User reviewed and approved proceeding to Task 03. |
| Task 03: Descriptive Generated Conversation Titles | [task_03.md](task_03.md) | Approved | IMP-07 | User reviewed and approved proceeding to Task 04. |
| Task 04: Conversation Title Editing | [task_04.md](task_04.md) | Review | IMP-02 | Conversation rename PATCH API and sidebar pencil edit flow are implemented; server test/build and client lint/build passed. |
| Task 05: Editable Conversation Document Scope | [task_05.md](task_05.md) | Pending | IMP-03 | Patch existing conversation document membership without creating a new chat. |
| Task 06: Conversation Delete Flow | [task_06.md](task_06.md) | Pending | IMP-04 | Add hard delete with cascade cleanup; archive remains a product decision. |
| Task 07: Stop Generating During Streaming | [task_07.md](task_07.md) | Pending | IMP-05 | Add abort UI and client-side stream cleanup behavior. |
| Task 08: Message Timestamps and Loading Skeleton | [task_08.md](task_08.md) | Pending | IMP-08, IMP-09 | UI-only polish after behavioral changes. |
| Task 09: SSE Error Recovery and Retry | [task_09.md](task_09.md) | Pending | IMP-10 | Add explicit EventSource error handling and retry path. |
| Task 10: Verification and Reference Update | [task_10.md](task_10.md) | Pending | All selected IMPs | Run builds/tests/manual checks and update project reference. |

## Key Technical Decisions

- Keep the existing `/api/v1/chat/conversations` REST shape.
- Add `PATCH /api/v1/chat/conversations/:conversationId` for title changes.
- Add `PATCH /api/v1/chat/conversations/:conversationId/documents` for replacing the document scope on an existing conversation.
- Add `DELETE /api/v1/chat/conversations/:conversationId` for conversation deletion.
- Keep document scope changes explicit: the user can add or remove documents at any point, but the UI must warn that future answers use the new scope while old answers were generated from the previous scope.
- Do not create a new conversation when the user edits scope.
- Keep at least one document required for every conversation.
- Validate selected document IDs with the existing document lookup path and deduplicate IDs on the server.
- Wrap conversation document replacement in a database transaction.
- Invalidate TanStack Query caches for `["documents"]`, `["chat", "conversations"]`, and the active `["chat", "conversation", id]` where relevant.
- Keep SSE event types compatible with the existing `sources`, `token`, `done`, and `error` flow.
- Do not implement soft archive unless a new `archivedAt` database field and list filtering behavior are explicitly approved.

## Target API Additions

- `PATCH /api/v1/chat/conversations/:conversationId`
  - Request: `{ "title": "Flight ops research" }`
  - Response data: `{ "conversation": Conversation }`
- `PATCH /api/v1/chat/conversations/:conversationId/documents`
  - Request: `{ "documentIds": ["..."] }`
  - Response data: `{ "conversation": Conversation }`
- `DELETE /api/v1/chat/conversations/:conversationId`
  - Response data: `{ "conversation": Conversation }`

## Strict Workflow

- Always read this lookup file before starting or resuming this module.
- Always read the current task file before implementing that task.
- Complete tasks in numeric order.
- After completing a task, update this lookup file with the task status and notes.
- Stop after each task and ask the user for review.
- Continue to the next task only after explicit approval.
- Do not touch unrelated user changes. Current repo inspection found an existing uncommitted change in `client/src/routes/app.chat.tsx`; read it before editing that file.
- After the full module is completed and approved, update `project_context/MASTER_PROJECT_REFERENCE.md` with new API contracts, UI behavior, verification commands, and pitfalls.

## Completion Summary

- Planning is approved.
- Task 02 is approved.
- Task 03 is approved.
- Task 04 is ready for review.
- Client verification for Task 02: `npm run build` from `client/` passed with the existing large chunk warning.
- Client verification for Task 03: `npm run build` from `client/` passed with the existing large chunk warning.
- Server verification for Task 04: `npm test -- chat.service.spec.ts --runInBand` passed.
- Server verification for Task 04: `npm run build` from `server/` passed.
- Client verification for Task 04: `npm run lint` from `client/` passed with existing warnings only.
- Client verification for Task 04: `npm run build` from `client/` passed with the existing large chunk warning.
- IMP-06 was intentionally excluded because the user did not request it in this improvement batch.
