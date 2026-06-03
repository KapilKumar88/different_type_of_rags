# Parent-Child RAG Module

## Purpose & Scope

Convert the existing **naive RAG** flow into a **Parent-Child RAG** flow ("search small chunks, answer from bigger chunks"). Documents are split into large **parent** chunks and small **child** chunks. Only the children are embedded and searched (precise matching); matched children are mapped back to their **parent** chunks, and the larger parent text is fed to the LLM (richer context).

**Confirmed decisions**
- Parent chunks stored in a new Postgres `document_parents` table (FK to `documents.id`, `onDelete: cascade`). Children stored in Qdrant carrying `parentId`. Retrieval fetches parent text from Postgres by id.
- Parent chunk size 2000 / overlap 200; child chunk size 400 / overlap 50. All configurable via `rag.config` + `env`.
- Workflow: task-by-task with review gates. Stop for explicit user review after each task.

## Status Legend
- ⬜ Not started
- 🟦 In progress
- ✅ Done (reviewed & approved)

## Task Status

| # | Task | Status | Notes |
|---|------|--------|-------|
| 01 | [Config, env, module-plan scaffolding](task_01.md) | ✅ | 6 new env vars + rag.config fields. Build + env.spec green. |
| 02 | [document_parents schema + migration](task_02.md) | ✅ | Migration 0004_ambitious_venus.sql applied. Build green. |
| 03 | [Parent/child splitting helper](task_03.md) | ✅ | splitDocumentIntoParents + 5 passing tests. Old splitDocumentText removed. |
| 04 | [Parent repo + parent-child ingestion](task_04.md) | ✅ | DocumentParentsRepository, createWithParents transaction, child vectors carry parentId. 16 tests pass. |
| 05 | [Parent-child retrieval in chat](task_05.md) | ✅ | retrieveConversationSources uses childTopK/parentTopK, dedupes parents, feeds parent text to LLM. 31 tests pass. |
| 06 | [E2E verification, cleanup, docs](task_06.md) | ✅ | E2E test: upload creates document_parents rows, FK cascade on delete confirmed. 103 unit tests + 1 e2e test green. Transaction order bug fixed (documents before parents). |

## Key Technical Decisions
- **Parent store = Postgres** (not Qdrant payload duplication) for clean, persistent, cascade-deletable storage with no text duplication.
- **Child payload gains `parentId`**; `RetrievedChunk` widened with optional `parentId`. The `conversation_messages.sources` column is `jsonb().$type<RetrievedChunk[] | null>()`, so no migration is needed for the sources shape.
- **`chunkCount` on `documents` = child count** (matches the prior "number of indexed vectors" meaning).
- **Retrieval**: search `childTopK` children → dedupe to unique parents preserving best-child-score order → cap at `parentTopK` → fetch parent rows → feed parent text to the LLM.
- **Ingest ordering**: embed children → upsert child vectors to Qdrant → insert parents + document row in one DB transaction; on transaction failure, clean up the upserted Qdrant vectors.

## Workflow / Review Gates
- Read this plan and the task file before starting each task.
- Complete tasks in numeric order; do not implement future tasks early.
- After each task: build + relevant tests green, update this table, then STOP for user review.
- Continue only after explicit approval.

## Completion Summary

All 6 tasks completed. The naive RAG flow has been fully restructured into a parent-child RAG:

- **Ingest**: documents split into parent (~2000 char) and child (~400 char) chunks. Children embedded → stored in Qdrant with `parentId`. Parents stored in `document_parents` Postgres table. Both inserted in a single DB transaction (document row first, then parents — FK order matters).
- **Retrieve**: embed query → search top `childTopK` children → dedupe to unique parents by best score → cap at `parentTopK` → fetch parent text from Postgres → feed parent text (not child text) to LLM.
- **Delete**: `qdrant.deleteByDocumentId` removes child vectors; `deleteByIdForUser` removes document row → FK cascade removes parent rows.
- **Bug fixed during E2E**: `createWithParents` was inserting parents before the document row, violating the FK. Fixed by inserting the document first.
- **Backward compat note**: existing naive RAG documents (no `parentId` in Qdrant payloads) are incompatible — must be re-uploaded.
