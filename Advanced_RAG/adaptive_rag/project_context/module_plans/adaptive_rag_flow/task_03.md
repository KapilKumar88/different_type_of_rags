# Task 03: Adaptive RAG Runtime Services

## Goal

Implement the adaptive backend runtime that plans, retrieves, grades, rewrites, generates, validates, and returns a final response payload.

## Scope

- Create a focused Adaptive RAG runtime module/service under `server/src/services/`.
- Implement safe prompt templates for:
  - Query routing.
  - Query rewriting.
  - Retrieved chunk relevance grading.
  - Answer grounding and usefulness grading.
  - Final answer generation.
- Reuse existing `EmbeddingsService`, `QdrantService`, `LlmService`, and `RagConcurrencyLimiterService`.
- Keep all retrieval scoped to selected document IDs.
- Add focused unit tests with mocked LLM/Qdrant/embedding behavior.

## Implementation Details

- Planner decision should be conservative:
  - Retrieval is the default for document questions and follow-ups.
  - Non-document requests should return the canonical fallback rather than answer from general model knowledge.
- Retrieval attempt flow:
  - Embed current query.
  - Search selected document IDs only.
  - Filter weak vector scores and/or grade chunks with the LLM.
  - If context is weak, rewrite the query using bounded conversation history and retry once.
- Generation flow:
  - Generate a complete answer from graded context.
  - Grade the answer against source context and latest user message.
  - If ungrounded or not useful, retry generation once with stricter instructions or fall back.
- Trace flow:
  - Return compact step metadata suitable for persistence and UI display.
  - Do not include raw prompts or full hidden chain-of-thought.
- Error handling:
  - Dependency failures should surface through existing stream error mapping.
  - Invalid LLM JSON should produce conservative fallback decisions, not crashes.

## Completion Criteria

- Adaptive runtime has focused tests for successful answer, weak retrieval rewrite, no-source fallback, invalid grader JSON fallback, and ungrounded answer fallback.
- No direct database access is added to runtime services.
- No global/unscoped search path exists.
- Module plan task status and notes are updated.

## Test Cases

- `npm test -- adaptive-rag --runInBand` or exact runtime spec paths from `server/`.
- `npm run build` from `server/`.

## Review Gate

Stop after Task 03 and ask the user for review before wiring the runtime into the public chat API.

## Completion Notes

- Added `server/src/services/adaptive-rag/adaptive-rag.module.ts`.
- Added `AdaptiveRagService` with conservative routing, scoped retrieval, score filtering, LLM source grading, query rewrite retry, grounded answer generation, answer validation, and safe fallback result creation.
- Added prompt and parser helpers that keep retrieved text/history bounded and treat LLM JSON output as untrusted.
- Added focused tests covering:
  - successful grounded answer
  - weak retrieval rewrite/retry
  - no-source fallback
  - invalid source-grade JSON fallback
  - ungrounded answer fallback
- Verified:
  - `npm test -- adaptive-rag.service.spec.ts --runInBand`
  - `npm run build`
