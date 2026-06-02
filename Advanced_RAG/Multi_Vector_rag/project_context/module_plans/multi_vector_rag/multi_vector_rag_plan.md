# Multi-Vector RAG Module Plan

## Module Purpose and Scope

Implement multi-vector RAG over the existing authenticated document and chat flow. New uploads index each parent chunk as original text, generated summary, and generated hypothetical questions. Retrieval searches all representations, fuses matches back to parent chunks, and keeps final answer prompts grounded in parent chunk text.

Out of scope:

- Reindex endpoint for existing documents.
- Postgres schema migration.
- Qdrant named vectors.
- LangGraph, queues, agents, hybrid search, or reranking.

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete

## Task Status

| Task | Status | Notes |
| --- | --- | --- |
| [Task 01](task_01.md) | [x] | Planning files created; implementation approved by user. |
| [Task 02](task_02.md) | [x] | Multi-vector config, types, generation, indexing, retrieval, and Qdrant compatibility implemented. |
| [Task 03](task_03.md) | [x] | Document upload, chat retrieval, and client source debug UI wired. |
| [Task 04](task_04.md) | [x] | Targeted tests, server build, client lint, client build, and project reference update completed. |

## Key Technical Decisions

- Preserve existing document upload, document listing/deletion, conversation, and SSE endpoint URLs.
- Keep old Naive RAG Qdrant payloads searchable by treating missing representation metadata as an `original` match.
- Store parent chunk text in Qdrant payload `text`; store representation text in `vectorText`.
- Use MaxSim parent scoring during retrieval: parent score is the best representation match score.
- Return additive debug metadata in `sources.matches` and `sources.bestMatchType`; keep `sources.score`.
- Keep `documents.chunkCount` as parent chunk count.

## Workflow and Review Gate

- Complete tasks in order.
- Update this plan as each task progresses.
- Run targeted backend tests, server build, client lint, and client build before marking complete.
- User has explicitly requested implementation of the approved plan end to end.

## Completion Summary

Multi-vector RAG is implemented for new uploads. Each parent chunk is indexed as original text, one LLM-generated summary, and configured hypothetical questions. Retrieval searches all representation vectors, fuses matches by parent chunk with MaxSim scoring, returns debug match metadata, and keeps final answer prompts grounded in parent chunk text.

Verification:

- `npm test -- --runTestsByPath src/services/multi-vector-rag/multi-vector-representation.service.spec.ts src/services/multi-vector-rag/multi-vector-indexing.service.spec.ts src/services/multi-vector-rag/multi-vector-retrieval.service.spec.ts src/services/qdrant/qdrant.service.spec.ts src/api/v1/documents/documents.service.spec.ts src/api/v1/chat/chat.service.spec.ts src/config/env.spec.ts --runInBand` from `server/` passed.
- `npm test -- --runInBand` from `server/` passed.
- `npm run build` from `server/` passed.
- `npm run lint` from `client/` passed with existing Fast Refresh warnings only.
- `npm run build` from `client/` passed.
- Manual runtime smoke was not run because Postgres, Qdrant, and Ollama service availability is environment-dependent.
