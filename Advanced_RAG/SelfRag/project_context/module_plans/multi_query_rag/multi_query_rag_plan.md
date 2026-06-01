# Multi-Query RAG Module Plan

## Module Purpose and Scope

Replace the current Query Rewriting RAG example with a focused Multi-Query RAG implementation. The chat flow must generate multiple retrieval queries, search selected conversation documents for each query, deduplicate and rank retrieved chunks, answer from the final scoped context, persist retrieval metadata, and show the generated query audit data in the client.

In scope:

- Backend Multi-Query RAG service using the existing Ollama chat model.
- Chat retrieval integration with document-scoped Qdrant fan-out search.
- Retrieval metadata type, SSE, persistence, and client audit updates.
- Focused backend/client verification.
- `MASTER_PROJECT_REFERENCE.md` updates after implementation.

Out of scope:

- LangGraph.
- Agents.
- Hybrid search.
- Reranking.
- Queue-based ingestion.
- Global unscoped search endpoints.
- Strategy selector or side-by-side Query Rewriting mode.

## Status Legend

- `Pending`: Not started.
- `In Progress`: Implementation has started but is not ready for review.
- `Review`: Task is complete and waiting for user review.
- `Approved`: User reviewed and approved the task.

## Task Status

| Task | File | Status | Notes |
| --- | --- | --- | --- |
| Task 01: Planning and Task Files | [task_01.md](task_01.md) | Approved | User approved proceeding to Task 02. |
| Task 02: Baseline Verification | [task_02.md](task_02.md) | Approved | User approved proceeding to Task 03. |
| Task 03: Multi-Query Service | [task_03.md](task_03.md) | Approved | User approved proceeding to Task 04. |
| Task 04: Chat Retrieval Integration | [task_04.md](task_04.md) | Approved | User approved completing remaining tasks. |
| Task 05: Client Audit Display | [task_05.md](task_05.md) | Approved | User approved completing remaining tasks; client lint/build passed. |
| Task 06: Verification and Context Update | [task_06.md](task_06.md) | Approved | Final verification passed and `MASTER_PROJECT_REFERENCE.md` was updated. |

## Key Technical Decisions

- Multi-Query RAG replaces Query Rewriting RAG in this folder.
- Always include the original user query as the first retrieval query.
- Generate up to `RAG_MULTI_QUERY_COUNT` total queries, default `4`.
- Treat conversation history and latest user text as untrusted data during query generation.
- Fall back to `[originalQuery]` if query generation fails or returns unusable output.
- Embed each generated query and search only owned documents selected for the conversation.
- Deduplicate final retrieved chunks by `chunkId`, keeping each chunk's best score.
- Return at most `RAG_TOP_K` final chunks to answer generation.
- Keep the original latest user message in the final answer prompt.

## Strict Workflow and Review Gates

- Always read this plan file before starting or resuming Multi-Query RAG work.
- Always read the current task file before implementing that task.
- Complete tasks in numeric order.
- Do not implement future tasks early.
- After completing each task, update this plan file with the task status and notes.
- Stop after each task and ask the user for review.
- Continue to the next task only after explicit approval.
- After the full module is completed and approved, update `project_context/MASTER_PROJECT_REFERENCE.md` with current-state facts, API contracts, architecture changes, verification commands, and any pitfalls or decisions discovered during implementation.

## Completion Summary

- Task 01 is approved.
- Task 02 is approved.
- Task 03 is approved.
- Task 04 is approved.
- Chat integration verification passed:
  - `npm test -- chat.service.spec.ts --runInBand` from `server/`.
  - `npm test -- multi-query.service.spec.ts --runInBand` from `server/`.
  - `npm run build` from `server/`.
- Task 05 is approved.
- Client audit display verification passed:
  - `npm run lint` from `client/` passed with existing Fast Refresh warnings only.
  - `npm run build` from `client/` passed.
- Task 06 is approved.
- Final verification passed:
  - `npm test -- multi-query.service.spec.ts --runInBand` from `server/`.
  - `npm test -- chat.service.spec.ts --runInBand` from `server/`.
  - `npm run build` from `server/`.
  - `npm run lint` from `client/` passed with existing Fast Refresh warnings only.
  - `npm run build` from `client/`.
- `project_context/MASTER_PROJECT_REFERENCE.md` now documents Multi-Query RAG current state, metadata contract, config, verification, and pitfalls.
- Baseline verification passed:
  - `npm test -- query-rewriting.service.spec.ts --runInBand` from `server/`.
  - `npm test -- chat.service.spec.ts --runInBand` from `server/`.
  - `npm run build` from `server/`.
