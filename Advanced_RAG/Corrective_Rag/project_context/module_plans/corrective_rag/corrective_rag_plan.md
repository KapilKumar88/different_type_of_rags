# Corrective RAG Module Plan

## Module Purpose and Scope

Convert the active persisted Self-RAG chat pipeline into Corrective RAG. The system must keep authenticated conversation APIs and SSE event names unchanged, use selected uploaded documents first, retry local retrieval with a corrective query when local context is weak, and use Tavily web search only after local correction fails.

In scope:

- Corrective RAG backend orchestration, evaluator prompts, Tavily web search provider, metadata types, and chat integration.
- Backward-compatible metadata and source rendering for old `multi_query` and `self_rag` assistant messages.
- Client Corrective RAG trace/source display.
- Verification and project reference updates.

Out of scope:

- Persisting web results into Qdrant.
- Adding new HTTP endpoints.
- Making RAG mode selectable in the UI.
- LangGraph, queues, reranking, or agentic memory.

## Status Legend

- `Pending`: Not started.
- `In Progress`: Implementation has started but is not ready for review.
- `Review`: Task is complete and waiting for user review.
- `Approved`: User reviewed and approved the task.

## Task Status

| Task | File | Status | Notes |
| --- | --- | --- | --- |
| Task 01: Planning and Baseline | [task_01.md](task_01.md) | Approved | Planning files created; baseline `npm test -- self-rag-evaluator.service.spec.ts self-rag.service.spec.ts chat.service.spec.ts multi-query.service.spec.ts env.spec.ts --runInBand` passed from `server/`. Continuing full implementation as requested. |
| Task 02: Backend Types, Config, and Tavily Provider | [task_02.md](task_02.md) | Approved | Added Corrective RAG metadata/source union types, typed Tavily/web-search config, Tavily provider/module, and focused provider tests. |
| Task 03: Corrective RAG Orchestration and Chat Wiring | [task_03.md](task_03.md) | Approved | Chat now delegates to Corrective RAG; targeted server tests passed with `6` suites and `45` tests. |
| Task 04: Client Corrective RAG Trace | [task_04.md](task_04.md) | Approved | Client renders Corrective RAG traces and document/web source unions while preserving legacy Multi-Query and Self-RAG displays. |
| Task 05: Verification and Reference Update | [task_05.md](task_05.md) | Approved | Targeted server tests, server build, client lint, and client build passed; `MASTER_PROJECT_REFERENCE.md` updated. |

## Key Technical Decisions

- New assistant messages persist `retrievalMetadata.strategy: "corrective_rag"`.
- Old `strategy: "multi_query"` and `strategy: "self_rag"` metadata remain supported.
- Web search uses Tavily only after initial local retrieval and corrective local retry fail.
- Tavily results are used only for the current answer and persisted as message source metadata; they are not indexed into Qdrant.
- Missing or failed `TAVILY_API_KEY` degrades gracefully without exposing raw provider errors.
- No database migration is expected because `sources` and `retrieval_metadata` are JSONB.

## Strict Workflow and Review Gates

- Always read this plan before starting or resuming Corrective RAG work.
- Always read the current task file before implementing that task.
- Complete tasks in numeric order.
- Do not implement future tasks early unless the user explicitly asks to continue through all tasks.
- After completing each task, update this plan with task status and notes.
- After the full module is completed, update `project_context/MASTER_PROJECT_REFERENCE.md` with current-state facts, API contracts, architecture changes, verification commands, and pitfalls.

## Completion Summary

- Corrective RAG replaced the active Self-RAG chat answer path.
- New backend messages persist `strategy: "corrective_rag"` retrieval metadata with local/corrective attempt traces, retrieval assessment, web-search status, final decision, and answer support/utility.
- Existing `strategy: "multi_query"` and `strategy: "self_rag"` metadata remains supported by server/client types and client rendering.
- Tavily web search is used only after local retrieval plus one corrective local retry fail. Missing or blank `TAVILY_API_KEY` degrades gracefully.
- No database migration was required because assistant message `sources` and `retrieval_metadata` are JSONB.
- Verification passed:
  - Baseline: `npm test -- self-rag-evaluator.service.spec.ts self-rag.service.spec.ts chat.service.spec.ts multi-query.service.spec.ts env.spec.ts --runInBand` from `server/`.
  - Final server tests: `npm test -- corrective-rag-evaluator.service.spec.ts corrective-rag.service.spec.ts tavily-web-search.service.spec.ts chat.service.spec.ts multi-query.service.spec.ts env.spec.ts --runInBand` from `server/`.
  - `npm run build` from `server/`.
  - `npm run lint` from `client/` passed with existing Fast Refresh warnings only.
  - `npm run build` from `client/`.
