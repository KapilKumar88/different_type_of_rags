# Hybrid RAG Module Plan

## Purpose

Upgrade the current dense-only RAG flow into Qdrant-based Hybrid RAG while preserving authenticated, user-owned, document-scoped conversations.

Module scope:

- Add sparse keyword vector support for newly uploaded chunks.
- Keep dense semantic retrieval through the existing Qdrant vector.
- Fuse dense and sparse candidates locally with weighted Reciprocal Rank Fusion.
- Expose retrieval diagnostics in stored source payloads and the chat UI.
- Keep existing HTTP endpoints stable.

Out of scope:

- Backfilling existing uploaded documents.
- External sparse models, reranker models, LangGraph, agents, queues, or global ask endpoints.
- Recreating or deleting existing Qdrant collections.

## Status Legend

- `Pending`: Not started.
- `In Progress`: Implementation has started but is not ready for review.
- `Review`: Task is complete and waiting for user review.
- `Approved`: User reviewed and approved the task.

## Task Status

| Task | File | Status | Notes |
| --- | --- | --- | --- |
| Task 01: Planning and Config | [task_01.md](task_01.md) | Review | Module plan/task files created; typed hybrid config defaults added. |
| Task 02: Sparse Vectorizer and Qdrant Support | [task_02.md](task_02.md) | Review | Sparse vectorizer, Qdrant sparse vector setup, payload index, sparse updates, and upload cleanup implemented. |
| Task 03: Hybrid Retrieval Flow | [task_03.md](task_03.md) | Review | Dense+sparse scoped search and weighted RRF fusion implemented through shared retrieval service. |
| Task 04: Client Diagnostics | [task_04.md](task_04.md) | Review | Source diagnostics render retrieval mode, fused score, dense/sparse scores, and ranks with optional-field compatibility. |
| Task 05: Verification and Reference Update | [task_05.md](task_05.md) | Review | Focused tests and builds passed; master reference updated. |

## Key Technical Decisions

- Use Qdrant sparse named vector `text_sparse`.
- Add `text_sparse` to existing collections in place with `createVectorName`; do not recreate collections.
- Do not backfill existing documents. Existing chunks remain dense-searchable; new uploads get sparse vectors.
- Use deterministic local sparse vectors with stable hashing and term-frequency weights.
- Use local weighted RRF so source payloads can include dense/sparse ranks and scores.
- Keep all chat/document endpoint paths and request shapes unchanged.

## Strict Workflow

- Read this module plan before starting or resuming Hybrid RAG work.
- Read each current task file before implementing that task.
- Complete tasks in numeric order.
- Update this module plan after each task with status and notes.
- Preserve document-scoped retrieval and user ownership checks.
- Update `project_context/MASTER_PROJECT_REFERENCE.md` after implementation.

## Completion Summary

Hybrid RAG implementation is ready for review. Existing uploads are not backfilled and remain dense-searchable; newly uploaded chunks receive sparse vectors and participate in dense+sparse fusion.
