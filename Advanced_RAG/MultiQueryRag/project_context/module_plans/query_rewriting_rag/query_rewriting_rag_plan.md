# Query Rewriting RAG Module Plan

## Module Purpose and Scope

Implement Query Rewriting RAG on top of the current authenticated, document-scoped RAG flow. The system must rewrite the latest user message into a concise standalone retrieval query before embedding and Qdrant search, while preserving the original user message for final answer generation.

In scope:

- Backend query rewriting service using the existing Ollama chat model.
- Retrieval metadata persistence on assistant messages.
- SSE and client type updates so the rewritten search query is auditable in the chat UI.
- Focused backend/client tests and builds.
- Project reference updates after the module is complete and approved.

Out of scope:

- LangGraph.
- Agents.
- Hybrid search.
- Reranking.
- Queue-based ingestion.
- Global unscoped search endpoints.

## Status Legend

- `Pending`: Not started.
- `In Progress`: Implementation has started but is not ready for review.
- `Review`: Task is complete and waiting for user review.
- `Approved`: User reviewed and approved the task.

## Task Status

| Task | File | Status | Notes |
| --- | --- | --- | --- |
| Task 01: Planning and Task Files | [task_01.md](task_01.md) | Approved | User approved proceeding to Task 02. |
| Task 02: Backend Schema and Types | [task_02.md](task_02.md) | Approved | User approved proceeding to Task 03. |
| Task 03: Query Rewriting Service | [task_03.md](task_03.md) | Approved | User approved proceeding to Task 04. |
| Task 04: Chat Flow Integration | [task_04.md](task_04.md) | Approved | User approved proceeding to Task 05. |
| Task 05: Client Audit Display | [task_05.md](task_05.md) | Approved | User approved proceeding to Task 06. |
| Task 06: Verification and Context Update | [task_06.md](task_06.md) | Approved | Final focused verification passed and `MASTER_PROJECT_REFERENCE.md` was updated with Query Rewriting RAG current state. |

## Key Technical Decisions

- Query rewriting is always enabled for the chat RAG flow.
- Use the existing configured Ollama chat model at temperature `0`.
- Use conversation history only to resolve references in the retrieval query.
- Treat user messages and conversation history as untrusted content during rewriting.
- Fall back to the original user message if rewriting fails, returns empty output, or produces unusable output.
- Embed the rewritten query for retrieval, but keep the original user message in the final answer prompt.
- Persist retrieval audit data on assistant messages as nullable JSONB under `retrievalMetadata`.
- Keep retrieval document-scoped through owned conversations and selected document IDs.

## Strict Workflow and Review Gates

- Always read this plan file before starting or resuming Query Rewriting RAG work.
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
- Task 05 is approved.
- Task 06 is ready for final review.
- Query Rewriting RAG is implemented end to end across backend retrieval, SSE/persistence contracts, and client audit display.
- Verification: `npm test -- query-rewriting.service.spec.ts --runInBand` passed from `server/`.
- Verification: `npm test -- chat.service.spec.ts --runInBand` passed from `server/`.
- Verification: `npm run build` passed from `server/`.
- Verification: `npm run lint` passed from `client/` with existing Fast Refresh warnings only.
- Verification: `npm run build` passed from `client/`.
- Manual runtime acceptance was not run because the full Postgres/Qdrant/Ollama runtime stack was not confirmed active in this environment.
