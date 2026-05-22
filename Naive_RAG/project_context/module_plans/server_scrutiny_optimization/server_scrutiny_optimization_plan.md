# Server Scrutiny Optimization Plan

## Purpose

This file is the lookup and status tracker for production-readiness work found during scrutiny of `server/`.

The analysis scope covers:

- Build breakages that stop the backend from running.
- User data isolation and authorization risks.
- RAG retrieval scoping and prompt safety.
- Upload, parsing, and LLM abuse controls.
- Postgres/Qdrant consistency.
- API documentation, TypeScript strictness, and repository hygiene.

Out of scope unless approved in a later task:

- Replacing NestJS, Drizzle, Qdrant, or Ollama.
- Implementing agentic RAG, LangGraph, reranking, or hybrid search.
- Broad frontend changes beyond API contract compatibility.

## Current Evidence

- Baseline before Task 01: `npm run build` from `server/` failed because shared RAG services were moved under `src/services/*`, while imports still referenced the old `src/api/v1/*` paths.
- Documents are global: `documents` has no `userId`, `DocumentsController` does not pass `CurrentUser`, and document repository/service methods are not scoped by owner.
- `POST /api/v1/chat/ask` searches the full Qdrant collection instead of an owned conversation or document set.
- Document upload uses Multer `memoryStorage()` without a file size limit or content validation beyond extension checks.
- Document upload/delete spans Qdrant and Postgres without a consistency strategy for partial failures.
- Auth endpoints are throttled, but upload, chat message creation, SSE streaming, and ask endpoints are not.
- Retrieved document text and conversation history are inserted directly into prompts without explicit untrusted-content boundaries or token budgeting.
- SSE answer generation fetches the target message before confirming conversation ownership and emits raw error messages.
- Swagger is required by project standards but is not configured in the server.
- TypeScript strictness is partially relaxed in `server/tsconfig.json`.
- Local generated/runtime folders exist in the tree and should stay ignored during reviews: `server/.env`, `server/dist`, and `server/node_modules`.

## Status Legend

- `Pending`: Not started.
- `In Progress`: Implementation has started but is not ready for review.
- `Review`: Task is complete and waiting for user review.
- `Approved`: User reviewed and approved the task.

## Task Status

| Task                                              | File                     | Status   | Focus                | Notes                                                                 |
| ------------------------------------------------- | ------------------------ | -------- | -------------------- | --------------------------------------------------------------------- |
| Task 01: Restore Server Build After Service Move  | [task_01.md](task_01.md) | Approved | Build breakage       | User approved and requested Task 02 implementation.                   |
| Task 02: Enforce Document Ownership               | [task_02.md](task_02.md) | Approved | Security             | User approved and requested Task 03 implementation.                   |
| Task 03: Remove Or Scope Global Ask Retrieval     | [task_03.md](task_03.md) | Review   | Security             | Removed legacy `/api/v1/chat/ask` and unscoped Qdrant search.         |
| Task 04: Harden Upload Limits And Validation      | [task_04.md](task_04.md) | Pending  | Security/performance | Add upload size, MIME, content, extraction, and chunk limits.         |
| Task 05: Add Postgres/Qdrant Consistency Strategy | [task_05.md](task_05.md) | Pending  | Reliability          | Prevent orphan vectors and stale metadata after partial failures.     |
| Task 06: Add RAG Abuse Controls                   | [task_06.md](task_06.md) | Pending  | Reliability/security | Add throttling and concurrency controls to expensive RAG endpoints.   |
| Task 07: Harden Prompt Context Boundaries         | [task_07.md](task_07.md) | Pending  | Security             | Treat documents/history as untrusted context and add token budgeting. |
| Task 08: Fix SSE Authorization And Error Leakage  | [task_08.md](task_08.md) | Pending  | Security             | Check ownership before message fetch and emit stable public errors.   |
| Task 09: Add Swagger Coverage                     | [task_09.md](task_09.md) | Pending  | API documentation    | Configure Swagger and document endpoint responses.                    |
| Task 10: Tighten TypeScript Strictness            | [task_10.md](task_10.md) | Pending  | Maintainability      | Enable stricter checks in staged backend-safe steps.                  |
| Task 11: Preserve Repository Hygiene              | [task_11.md](task_11.md) | Pending  | Maintainability      | Keep generated/runtime files out of review scope and tracking.        |

## Key Technical Decisions

- Fix build breakage first because no backend validation is trustworthy until TypeScript compiles.
- Preserve the current refactor direction that places shared infrastructure services under `src/services/*`.
- Keep API/domain modules under `src/api/v1/*`; only shared infrastructure belongs in `src/services/*`.
- Treat document ownership as a P0 security requirement before deeper RAG improvements.
- Prefer small, verifiable backend changes with focused tests after each task.

## Strict Workflow

- Always read this lookup file before starting or resuming this module.
- Always read the current task file before implementing that task.
- Complete tasks in numeric order.
- Do not implement future tasks early.
- After completing each task, update this lookup file with task status and notes.
- Run task-specific verification before marking a task ready for review.
- Do not touch unrelated user changes.
- After the full module is completed and approved, update `project_context/MASTER_PROJECT_REFERENCE.md` with new current-state facts, API contracts, verification commands, and pitfalls.

## Completion Summary

- Task 01 is approved.
- Task 01 verification:
  - `npm run build` from `server/` passed.
  - `npm test -- chat.service.spec.ts documents.service.spec.ts qdrant.service.spec.ts --runInBand` from `server/` passed with `3` suites and `32` tests.
- Task 02 is approved.
- Task 02 implementation:
  - Added `documents.userId` with a `users.id` foreign key and `documents_user_id_idx`.
  - Added migration `0003_happy_vertigo.sql`; it deliberately clears old unowned RAG conversations/documents before enforcing non-null document ownership.
  - Document upload/list/find/delete now require and use the authenticated user's ID.
  - Chat conversation document validation now checks selected documents within the authenticated user's document scope.
  - Added tests for user-scoped list/find/delete behavior and cross-user document selection rejection.
- Task 02 verification:
  - `npm run build` from `server/` passed.
  - `npm test -- chat.service.spec.ts documents.service.spec.ts --runInBand` from `server/` passed with `2` suites and `33` tests.
- Task 03 is ready for review.
- Task 03 implementation:
  - Removed the legacy `POST /api/v1/chat/ask` controller endpoint and DTO.
  - Removed `ChatService.ask` and its unscoped prompt path.
  - Removed `QdrantService.search`, leaving only document-scoped `searchByDocumentIds`.
  - Removed unused client ask endpoint config, service method, and types.
  - Verified no references remain to `chat/ask`, `AskQuestion*`, or unscoped `qdrantService.search`.
- Task 03 verification:
  - `npm run build` from `server/` passed.
  - `npm test -- chat.service.spec.ts qdrant.service.spec.ts --runInBand` from `server/` passed with `2` suites and `25` tests.
  - `npm run build` from `client/` passed.
