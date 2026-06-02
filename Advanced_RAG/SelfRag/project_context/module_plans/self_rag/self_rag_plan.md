# Self-RAG Module Plan

## Module Purpose and Scope

Upgrade the existing document-scoped Multi-Query RAG chat flow into a practical Self-RAG evaluator pipeline. The backend must keep the current authenticated conversation APIs and SSE event names while adding retrieval relevance grading, one retry/refinement path, answer support grading, persisted Self-RAG metadata, and a detailed client trace panel.

In scope:

- Backend Self-RAG orchestration and evaluator services.
- Chat stream integration with gated final-answer streaming.
- Backward-compatible retrieval metadata union.
- Detailed frontend Self-RAG trace rendering.
- Focused verification and project reference updates.

Out of scope:

- LangGraph, agents, hybrid search, queues, new endpoints, global retrieval, and paper-style reflection-token training.

## Status Legend

- `Pending`: Not started.
- `In Progress`: Implementation has started but is not ready for review.
- `Review`: Task is complete and waiting for user review.
- `Approved`: User reviewed and approved the task.

## Task Status

| Task | File | Status | Notes |
| --- | --- | --- | --- |
| Task 01: Planning Files | [task_01.md](task_01.md) | Approved | Planning files created; continuing full implementation as requested. |
| Task 02: Baseline Verification | [task_02.md](task_02.md) | Approved | `npm test -- multi-query.service.spec.ts chat.service.spec.ts --runInBand` passed from `server/`. |
| Task 03: Backend Self-RAG Services | [task_03.md](task_03.md) | Approved | Added Self-RAG metadata types, config defaults, evaluator/orchestration services, module wiring, and focused tests. |
| Task 04: Chat Integration | [task_04.md](task_04.md) | Approved | Chat stream now delegates gated answer generation to Self-RAG while preserving API/SSE contracts. |
| Task 05: Client Trace Panel | [task_05.md](task_05.md) | Approved | Client renders legacy Multi-Query audits and detailed expandable Self-RAG traces. |
| Task 06: Verification and Context Update | [task_06.md](task_06.md) | Approved | Final verification passed and `MASTER_PROJECT_REFERENCE.md` was updated. |

## Key Technical Decisions

- New assistant messages persist `strategy: "self_rag"` metadata; old `strategy: "multi_query"` messages remain readable.
- Self-RAG keeps retrieval scoped to selected conversation document IDs.
- The final answer is generated and graded internally before any answer token is streamed.
- Evaluator failures degrade gracefully and never emit raw dependency errors.
- No database migration is required because `retrieval_metadata` is already JSONB.

## Strict Workflow and Review Gates

- Always read this plan before starting or resuming Self-RAG work.
- Always read the current task file before implementing that task.
- Complete tasks in numeric order.
- Do not implement future tasks early unless the user explicitly asks to continue through all tasks.
- After completing each task, update this plan with task status and notes.
- After the full module is completed, update `project_context/MASTER_PROJECT_REFERENCE.md` with current-state facts, API contracts, architecture changes, verification commands, and pitfalls.

## Completion Summary

- Self-RAG replaced the active Multi-Query-only chat answer path.
- New backend messages persist `strategy: "self_rag"` retrieval metadata with attempt traces, relevance verdicts, retry/refinement details, final decision, and answer support/utility.
- Existing `strategy: "multi_query"` metadata remains supported by server/client types and client rendering.
- No database migration was required because assistant message retrieval metadata is already JSONB.
- Verification passed:
  - Baseline: `npm test -- multi-query.service.spec.ts chat.service.spec.ts --runInBand` from `server/`.
  - Final server tests: `npm test -- self-rag-evaluator.service.spec.ts self-rag.service.spec.ts chat.service.spec.ts multi-query.service.spec.ts env.spec.ts --runInBand` from `server/`.
  - `npm run build` from `server/`.
  - `npm run lint` from `client/` passed with existing Fast Refresh warnings only.
  - `npm run build` from `client/`.
