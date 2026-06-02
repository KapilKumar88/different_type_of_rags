# Multi-Hop RAG Module Plan

## Purpose

Upgrade the Naive RAG base (single embed → single Qdrant search → stream answer) into a true Multi-Hop RAG. Multi-hop retrieval decomposes a question into sub-questions, then iteratively retrieves and generates follow-up queries until enough evidence is gathered, enabling bridge questions whose answers span multiple document chunks that are not all similar to the original query.

## Scope

- Query decomposition: LLM splits the question into up to N standalone sub-questions.
- Iterative hop loop: sequential embed + Qdrant search per query, deduplicating chunks across hops, generating follow-up queries from intermediate evidence until DONE / max-hops / no-new-chunks.
- Hop trace: each step (kind, query, new chunk count) is emitted as a live SSE `hops` event and persisted on the assistant message.
- Final answer: synthesized from the merged, deduplicated, score-sorted, capped chunk set.
- UI: collapsible "Reasoning steps" panel per assistant message.
- Toggle: `RAG_MULTI_HOP_ENABLED` degrades to single-shot retrieval when `false`.

Out of scope for this version:

- Parallel hop execution.
- Reranking.
- Hybrid search.
- Graph-based traversal.
- LangGraph.

## Status Legend

- `Pending`: Not started.
- `In Progress`: Implementation has started but is not ready for review.
- `Review`: Task is complete and waiting for user review.
- `Approved`: User reviewed and approved the task.

## Task Status

| Task | File | Status | Notes |
| --- | --- | --- | --- |
| Task 01: Types and Config | [task_01.md](task_01.md) | Review | Build passes, env.spec.ts passes. |
| Task 02: MultiHopRetrieverService and Spec | [task_02.md](task_02.md) | Review | 6/6 spec tests pass; build passes. |
| Task 03: Schema Metadata Column and Migration | [task_03.md](task_03.md) | Review | Migration 0004_fast_spectrum.sql generated; 100/100 tests pass. |
| Task 04: Wire into ChatService and Module | [task_04.md](task_04.md) | Approved | 100/100 tests pass; build passes. |
| Task 05: Frontend Types, Stream, and UI Trace | [task_05.md](task_05.md) | Approved | Build passes; lint: 0 errors, 4 pre-existing warnings only. |
| Task 06: Docs and Verification | [task_06.md](task_06.md) | Approved | All checks pass. MASTER_PROJECT_REFERENCE.md and RagTypes.md updated. |

## Key Technical Decisions

- Strategy: iterative + decomposition (decompose first, then sequential hops with follow-up generation).
- UI: stream a `hops` SSE event and render collapsible Reasoning steps panel.
- Persistence: merged deduped sources + hop trace in a new `metadata` jsonb column on `conversation_messages`.
- Retrieval in each hop reuses the existing concurrency-limiter-wrapped embed + Qdrant search from `ChatService`.
- `MultiHopRetrieverService` lives under `server/src/services/rag-runtime/` (shared RAG infrastructure, not under api/).
- Config defaults keep the feature enabled out of the box; toggling `RAG_MULTI_HOP_ENABLED=false` falls back to naive.
- Prompt strings stay inline in service files (mirrors existing `chat.service.ts` style).

## Strict Workflow

- Always read this plan file before starting or resuming Multi-Hop RAG module work.
- Always read the current task file before implementing that task.
- Complete tasks in numeric order.
- After completing a task, update this file with the task status and notes.
- Stop after each task and ask the user for review before proceeding to the next task.
- Do not implement future tasks early unless the user explicitly asks to skip review gates.

## Completion Summary

All 6 tasks approved. Multi-Hop RAG is fully implemented:
- Server: decomposition + iterative retrieval + hop-trace persistence + `hops` SSE event.
- Client: `hops` stream listener + `ReasoningTrace` collapsible panel + `toChatMessage` mapping.
- Migration `0004_fast_spectrum.sql` adds the `metadata` jsonb column.
- `RAG_MULTI_HOP_ENABLED=false` degrades cleanly to single-hop retrieval.
- Server: 100/100 tests, clean build. Client: 0 lint errors, clean build.
