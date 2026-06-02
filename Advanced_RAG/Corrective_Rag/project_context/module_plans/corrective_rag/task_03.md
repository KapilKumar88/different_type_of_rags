# Task 03: Corrective RAG Orchestration and Chat Wiring

## Goal

Replace the active Self-RAG answer path with Corrective RAG while preserving existing HTTP and SSE contracts.

## Scope

- Add Corrective RAG evaluator/orchestration services.
- Wire `ChatService` through Corrective RAG.
- Remove stale Self-RAG debug logging from the active path.
- Keep retrieval scoped to selected conversation document IDs.

## Implementation Details

- Run initial multi-query local retrieval.
- Assess local retrieval as `correct`, `ambiguous`, `incorrect`, or `not_evaluated`.
- If weak, generate one corrective query and retry local retrieval.
- If still weak, call Tavily and answer from web context.
- Generate and grade the final answer before streaming any answer token.
- Persist `strategy: "corrective_rag"` metadata.

## Completion Criteria

- Chat stream emits `sources`, `token`, and `done` as before.
- Assistant messages persist source union data and Corrective RAG metadata.
- Stable stream errors do not expose raw dependency/provider messages.

## Test Cases

- Correct local retrieval answers without web.
- Weak local retrieval triggers corrective query retry.
- Failed corrective retry triggers Tavily web search.
- Missing/failed Tavily degrades to fallback.
- Chat service tests cover delegation, SSE event order, and persistence.

## Review Gate

Stop for review unless the user has explicitly requested continuing through implementation.
