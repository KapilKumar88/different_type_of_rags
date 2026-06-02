# Adaptive RAG Flow Module Plan

## Module Purpose and Scope

This module upgrades the existing protected, document-scoped Naive RAG chat flow into an Adaptive RAG flow while preserving the current authentication, conversation ownership, selected-document scoping, Qdrant/Ollama runtime, SSE streaming endpoint, and prompt-injection boundaries.

Adaptive RAG scope:

- Route each user message through an adaptive planner before retrieval/generation.
- Retrieve only from the conversation's selected, user-owned documents.
- Grade retrieved chunks for relevance before they are used as context.
- Rewrite the retrieval query and retry scoped retrieval when the first retrieval pass is weak.
- Generate answers from graded document context only.
- Grade generated answers for grounding and usefulness before they are persisted.
- Fall back to the existing safe document-not-found answer when the adaptive checks fail.
- Persist and stream a compact adaptive trace so the UI can show why a response was produced or rejected.
- Keep all new environment values behind typed config modules.
- Keep all API payload validation and stable error handling intact.

Out of scope for this module:

- Global, unscoped vector search.
- Web search or internet retrieval.
- Background queue ingestion.
- Redis or cross-process runtime state.
- External agent memory outside persisted conversation messages.
- Changing the document upload parser/chunker unless a direct adaptive-flow blocker is found.

## Status Legend

- `Pending`: Not started.
- `In Progress`: Implementation has started but is not ready for review.
- `Review`: Task is complete and waiting for user review.
- `Approved`: User reviewed and approved the task.

## Task Status

| Task | File | Status | Notes |
| --- | --- | --- | --- |
| Task 01: Planning and Existing Flow Audit | [task_01.md](task_01.md) | Approved | User approved proceeding to Task 02. |
| Task 02: Adaptive RAG Contracts and Persistence | [task_02.md](task_02.md) | Approved | User approved proceeding to Task 03. |
| Task 03: Adaptive RAG Runtime Services | [task_03.md](task_03.md) | Approved | User approved proceeding through remaining tasks. |
| Task 04: Chat API Integration | [task_04.md](task_04.md) | Approved | Adaptive runtime is wired into chat SSE and persistence; focused server verification passed. |
| Task 05: Client Adaptive Trace Integration | [task_05.md](task_05.md) | Approved | Client stream types, pending message state, persisted messages, and compact trace UI are implemented; client verification passed. |
| Task 06: Verification and Regression Coverage | [task_06.md](task_06.md) | Approved | Focused backend tests, full server unit suite, server build, client lint, and client build passed; manual runtime remains service-dependent. |
| Task 07: Final Context Update | [task_07.md](task_07.md) | Approved | Master project reference updated with Adaptive RAG architecture, API/SSE contracts, persistence, config, verification, and pitfalls. |

## Key Technical Decisions

- Keep the existing `/api/v1/chat/conversations/:conversationId/messages/:messageId/stream` endpoint so current client routing and persisted-message retry behavior remain valid.
- Add adaptive trace data to assistant messages instead of creating a separate public API because the trace belongs to the response that was generated.
- Keep Qdrant search scoped by selected conversation document IDs. Adaptive retry can rewrite the query, but it must never broaden retrieval beyond the selected document scope.
- Use existing `LlmService.generateAnswer()` for planner/grader calls and validated answer generation. Avoid adding new packages during this module.
- Stream the final validated answer through the existing SSE token event contract after adaptive checks finish.
- Treat all LLM JSON outputs as untrusted. Parse defensively, validate with typed helpers/Zod where useful, and fall back to conservative decisions when parsing fails.
- Keep prompt sections explicit and bounded: retrieved document text and conversation history remain untrusted prompt data.
- Preserve `ragConfig.fallbackAnswer` as the canonical fallback answer.

## Strict Workflow and Review Gates

- Always read this lookup file before starting or resuming Adaptive RAG work.
- Always read the current task file before implementing that task.
- Complete tasks in numeric order.
- Do not implement future tasks early.
- After completing each task, update this lookup file with the task status and notes.
- Stop after each task and ask the user for review.
- Continue to the next task only after explicit approval.
- After the full module is completed and approved, update `project_context/MASTER_PROJECT_REFERENCE.md`.

## Completion Summary

- All seven Adaptive RAG tasks are complete and approved by the user's instruction to proceed through pending tasks.
- Implemented server contracts, nullable `adaptive_trace` persistence, Drizzle migration, adaptive config, standalone adaptive runtime, chat SSE integration, client stream handling, client trace UI, full practical verification, and master context update.
- Verification passed:
  - `npm test -- adaptive-rag.service.spec.ts --runInBand` from `server/`.
  - `npm test -- chat.service.spec.ts --runInBand` from `server/`.
  - `npm test -- chat.controller.spec.ts --runInBand` from `server/`.
  - `npm test -- adaptive-rag.service.spec.ts chat.service.spec.ts chat.controller.spec.ts env.spec.ts --runInBand` from `server/`.
  - `npm test -- --runInBand` from `server/`.
  - `npm run build` from `server/`.
  - `npm run lint` from `client/`, passing with existing Fast Refresh warnings only.
  - `npm run build` from `client/`.
- Manual runtime acceptance was not run because it requires live Postgres, Qdrant, and Ollama services with the configured models.
