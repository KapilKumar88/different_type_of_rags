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

| Task                                              | File                     | Status   | Focus                | Notes                                               |
| ------------------------------------------------- | ------------------------ | -------- | -------------------- | --------------------------------------------------- |
| Task 01: Restore Server Build After Service Move  | [task_01.md](task_01.md) | Approved | Build breakage       | User approved and requested Task 02 implementation. |
| Task 02: Enforce Document Ownership               | [task_02.md](task_02.md) | Approved | Security             | User approved and requested Task 03 implementation. |
| Task 03: Remove Or Scope Global Ask Retrieval     | [task_03.md](task_03.md) | Approved | Security             | User approved and requested Task 04 implementation. |
| Task 04: Harden Upload Limits And Validation      | [task_04.md](task_04.md) | Approved | Security/performance | User approved and requested Task 05 implementation. |
| Task 05: Add Postgres/Qdrant Consistency Strategy | [task_05.md](task_05.md) | Approved | Reliability          | User approved and requested Task 06 implementation. |
| Task 06: Add RAG Abuse Controls                   | [task_06.md](task_06.md) | Approved | Reliability/security | User approved and requested Task 07 implementation. |
| Task 07: Harden Prompt Context Boundaries         | [task_07.md](task_07.md) | Approved | Security             | User approved and requested Task 08 implementation. |
| Task 08: Fix SSE Authorization And Error Leakage  | [task_08.md](task_08.md) | Approved | Security             | User approved and requested Task 09 implementation. |
| Task 09: Add Swagger Coverage                     | [task_09.md](task_09.md) | Approved | API documentation    | User approved and requested Task 10 implementation. |
| Task 10: Tighten TypeScript Strictness            | [task_10.md](task_10.md) | Approved | Maintainability      | User approved and requested Task 11 implementation. |
| Task 11: Preserve Repository Hygiene              | [task_11.md](task_11.md) | Approved | Maintainability      | User approved final task; module reference updated. |

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
- Task 03 is approved.
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
- Task 04 is approved.
- Task 04 implementation:
  - Added `documentUploadConfig` with a `50 MB` file size limit, `1,000,000` extracted-character limit, `1,000` chunk limit, and extension-to-MIME allowlists.
  - Added Multer `fileSize` enforcement on the upload interceptor.
  - Added server-side extension, MIME, and content-signature validation before extraction.
  - Added controlled `BadRequestException` wrapping for PDF/DOCX parser failures.
  - Added service guards for oversized extracted text and excessive chunk counts before embedding/Qdrant writes.
  - Added tests for oversized uploads, MIME mismatch, content mismatch, null-byte text uploads, excessive extracted text, excessive chunk count, and parser failure wrapping.
- Task 04 verification:
  - `npm run build` from `server/` passed.
  - `npm test -- documents.service.spec.ts text-extractor.spec.ts --runInBand` from `server/` passed with `2` suites and `21` tests.
- Task 05 is approved.
- Task 05 implementation:
  - Upload still writes Qdrant points before metadata, but now compensates by deleting those points if Postgres metadata creation fails.
  - Upload does not write metadata if Qdrant upsert fails.
  - Delete keeps the safer ordering of Qdrant cleanup before Postgres metadata deletion, so Qdrant failures leave metadata untouched and retries are safe.
  - Metadata deletion failures are propagated after Qdrant cleanup so callers can retry the idempotent delete path.
  - Fixed a Jest-incompatible absolute parsing-service helper import while verifying this task.
  - Added tests for upload metadata failure cleanup, Qdrant upsert failure, Qdrant delete failure, retry after transient Qdrant delete failure, and metadata delete failure.
- Task 05 verification:
  - `npm run build` from `server/` passed.
  - `npm test -- documents.service.spec.ts --runInBand` from `server/` passed with `1` suite and `14` tests.
  - `npm test -- document-parsing.service.spec.ts document-upload-validation.pipe.spec.ts --runInBand` from `server/` passed with `2` suites and `15` tests.
- Task 06 is approved.
- Task 06 implementation:
  - Added typed RAG rate-limit config and `.env.example` entries for upload, chat mutation, stream, and runtime concurrency limits.
  - Added upload throttling to `POST /api/v1/documents/upload`.
  - Added chat throttling to conversation creation, document-scope updates, and message creation.
  - Added stream throttling to SSE answer streaming.
  - Added `RagConcurrencyLimiterService` and wrapped document parsing, embeddings, Qdrant writes/searches, and LLM streaming with in-process concurrency limits.
  - Added controller metadata tests for throttled RAG routes and limiter tests for `429` behavior, cleanup after failures, and stream slot release.
- Task 06 verification:
  - `npm run build` from `server/` passed.
  - `npm test -- chat.controller.spec.ts documents.controller.spec.ts rag-concurrency-limiter.service.spec.ts chat.service.spec.ts documents.service.spec.ts --runInBand` from `server/` passed with `5` suites and `45` tests.
- Task 07 is approved.
- Task 07 implementation:
  - Added explicit prompt rules that treat retrieved document chunks and conversation history as untrusted content.
  - Wrapped retrieved chunks, prior conversation history, and the latest user message in separate XML-like sections.
  - Kept the latest user message outside prior history so truncation cannot remove the active question.
  - Added bounded prompt context and history character budgets.
  - Added prompt regression tests for malicious document instructions and long-history truncation.
- Task 07 verification:
  - `npm test -- chat.service.spec.ts --runInBand` from `server/` passed with `1` suite and `25` tests.
  - `npm run build` from `server/` passed.
- Task 08 is approved.
- Task 08 implementation:
  - SSE answer streaming now validates conversation ownership before looking up the requested message.
  - Stream retrieval reuses the already-owned conversation document scope instead of rechecking after message lookup.
  - Stream errors are mapped to stable public `error` events with `not_found`, `bad_request`, or `stream_failed` codes.
  - Raw dependency and exception messages are no longer emitted to SSE clients.
  - Added regression tests for cross-user stream probing, missing message behavior, retrieval failure leakage, and LLM stream failure leakage.
- Task 08 verification:
  - `npm test -- chat.service.spec.ts --runInBand` from `server/` passed with `1` suite and `28` tests.
  - `npm run build` from `server/` passed.
- Task 09 is approved.
- Task 09 implementation:
  - Added `@nestjs/swagger` and `swagger-ui-express`.
  - Added non-production Swagger setup at `/api/docs` with JSON at `/api/docs-json`.
  - Documented auth cookie and CSRF header security schemes.
  - Added Swagger operation, body, response, auth, CSRF, validation, rate-limit, not-found, and server-error metadata across auth, CSRF, documents, and chat controllers.
  - Added reusable OpenAPI schemas for standard success/error envelopes, users, documents, conversations, messages, and retrieved chunks.
  - Added regression coverage that generates the OpenAPI document and verifies key paths/security schemes.
- Task 09 verification:
  - `npm test -- openapi.spec.ts --runInBand` from `server/` passed with `1` suite and `2` tests.
  - `npm run build` from `server/` passed.
- Task 10 is approved.
- Task 10 implementation:
  - Enabled `noImplicitAny`.
  - Enabled `strictBindCallApply`.
  - Enabled `noFallthroughCasesInSwitch`.
  - Verified the current backend build config supports these stricter checks without additional casts or broad suppressions.
  - No strictness flags from the Task 10 scope were deferred.
- Task 10 verification:
  - `npx tsc -p tsconfig.build.json --noEmit --noImplicitAny true --strictBindCallApply true --noFallthroughCasesInSwitch true` from `server/` passed before changing config.
  - `npm run build` from `server/` passed.
  - `npm test -- openapi.spec.ts chat.service.spec.ts documents.service.spec.ts --runInBand` from `server/` passed with `3` suites and `44` tests.
- Task 11 is approved.
- Task 11 implementation:
  - Confirmed `server/.env`, `server/dist`, and `server/node_modules` are ignored by `server/.gitignore`.
  - Confirmed those runtime/generated paths are not tracked by Git.
  - Confirmed `git status --ignored --short Naive_RAG/server` separates intentional source/config/doc changes from ignored runtime/generated paths.
  - No local runtime/generated files were deleted.
- Task 11 verification:
  - `git ls-files Naive_RAG/server/.env Naive_RAG/server/dist Naive_RAG/server/node_modules` returned no tracked files.
  - `git check-ignore -v Naive_RAG/server/.env Naive_RAG/server/dist Naive_RAG/server/node_modules` showed ignore coverage from `Naive_RAG/server/.gitignore`.
  - `git status --ignored --short Naive_RAG/server` showed `!! Naive_RAG/server/.env`, `!! Naive_RAG/server/dist/`, and `!! Naive_RAG/server/node_modules/` as ignored.
- Module wrap-up:
  - Updated `project_context/MASTER_PROJECT_REFERENCE.md` with current server facts, API contracts, verification commands, and pitfalls from the completed server scrutiny optimization module.

## Final Module Summary

- Completed server scrutiny optimization Tasks 01 through 11.
- The server now builds after service moves, scopes documents and RAG retrieval by user-owned resources, removes unscoped global ask retrieval, hardens uploads, compensates partial Qdrant/Postgres failures, adds RAG abuse controls, separates untrusted prompt context, fixes SSE authorization/error leakage, exposes non-production Swagger docs, tightens TypeScript checks, and preserves generated/runtime hygiene.
- Final module verification commands recorded across task summaries:
  - `npm run build` from `server/`
  - `npm test -- chat.controller.spec.ts documents.controller.spec.ts rag-concurrency-limiter.service.spec.ts chat.service.spec.ts documents.service.spec.ts --runInBand` from `server/`
  - `npm test -- openapi.spec.ts chat.service.spec.ts documents.service.spec.ts --runInBand` from `server/`
  - `git ls-files Naive_RAG/server/.env Naive_RAG/server/dist Naive_RAG/server/node_modules`
  - `git check-ignore -v Naive_RAG/server/.env Naive_RAG/server/dist Naive_RAG/server/node_modules`
