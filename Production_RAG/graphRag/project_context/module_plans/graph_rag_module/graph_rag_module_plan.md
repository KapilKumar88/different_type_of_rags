# Graph RAG Module Plan

## Purpose

Upgrade the existing Naive RAG project into a Graph RAG system. Instead of embedding-based vector retrieval, the system extracts entities and relationships from document chunks using an LLM, stores them in a Neo4j knowledge graph, and answers questions by traversing the graph (entity linking → graph neighborhood → chunk text assembly).

Out of scope for this version (Naive RAG features removed):
- Qdrant vector search and embeddings (removed entirely from this variation)
- BullMQ queues, Redis, Socket.io
- LangGraph agents
- Hybrid search, reranking

In scope:
- Neo4j infrastructure service + config
- LLM-based entity/relationship extraction per chunk
- Graph domain module (CRUD, traversal, visualization API)
- Document ingestion rewritten to build the knowledge graph
- Chat retrieval rewritten to traverse the graph
- Client knowledge-graph visualization page (`/app/graph`)
- Client chat graph context panel ("Knowledge graph used")

---

## Status Legend

- `Pending`: Not started.
- `In Progress`: Implementation has started but is not ready for review.
- `Review`: Task is complete and waiting for user review.
- `Approved`: User reviewed and approved the task.

---

## Task Status

| Task | File | Status | Notes |
| --- | --- | --- | --- |
| Task 01: Planning and Task Files | [task_01.md](task_01.md) | Approved | Module plan and task files created. |
| Task 02: Neo4j Infrastructure | [task_02.md](task_02.md) | Review | neo4j-driver 6.0.1, Neo4jService with ensureConstraints (constraints + full-text index), global Neo4jModule, new env vars. |
| Task 03: Graph Types and Extraction Service | [task_03.md](task_03.md) | Review | graph.types.ts, graph.config.ts, GraphExtractionService with Zod-parsed JSON prompt. |
| Task 04: Graph Domain Module | [task_04.md](task_04.md) | Review | GraphRepository (all Cypher), GraphService (build/retrieve/delete/visualize), GraphController GET /api/v1/graph/documents/:id. |
| Task 05: Ingestion Changes | [task_05.md](task_05.md) | Review | documents.service.ts uses GraphService; embeddings+qdrant services deleted; env vars cleaned up; docs module imports GraphModule. |
| Task 06: Chat Changes + Migration | [task_06.md](task_06.md) | Review | chat.service.ts uses graph traversal; new SSE graph event; graphContext column migration 0004; chat.service.spec.ts fully updated. |
| Task 07: Client Graph Visualization Page | [task_07.md](task_07.md) | Review | /app/graph route with ForceGraph2D, document picker, entity/relationship legend, vendor-graph chunk, sidebar nav item. |
| Task 08: Client Chat Graph Context Panel | [task_08.md](task_08.md) | Review | onGraph SSE handler, ChatGraphContext component, graphContext on ChatMessage, toChatMessage updated. |
| Task 09: Verification and Context Update | [task_09.md](task_09.md) | Pending | |

---

## Key Technical Decisions

- **Graph store:** Neo4j via `neo4j-driver`. All graph write/read goes through `Neo4jService`.
- **Retrieval mode:** Graph-only traversal. No Qdrant, no embeddings. `services/embeddings/` and `services/qdrant/` are deleted.
- **Graph model:** `(:Entity)`, `(:Chunk)`, `(:Entity)-[:MENTIONED_IN]->(:Chunk)`, `(:Entity)-[:RELATED {type,description}]->(:Entity)`. All nodes scoped by `userId` + `documentId`.
- **Extraction:** One LLM call per chunk, Zod-parsed JSON, run through `RagConcurrencyLimiterService` (`graph-extraction` slot).
- **Chat retrieval:** extract question entities → full-text-index match → traverse N hops → assemble chunk texts + entity/relationship triples → prompt.
- **SSE graph event:** a new `graph` event type emitted before `sources` so the client can populate the "Knowledge graph used" panel.
- **Postgres migration:** add `graphContext jsonb` column to `conversation_messages`.
- **Client viz:** `react-force-graph-2d` in a dedicated lazy-loaded vendor chunk; route `/app/graph`.
- **Embedding model / Qdrant collection env vars:** removed; only Neo4j + Ollama LLM env vars remain.

---

## Strict Workflow

- Always read this plan file before starting or resuming module work.
- Always read the current task file before implementing that task.
- Complete tasks in numeric order.
- After completing a task, update this plan file with the task status and notes.
- Stop after each task and ask the user for review.
- Continue to the next task only after explicit approval.
- After the full module is completed and approved, update `project_context/MASTER_PROJECT_REFERENCE.md`.

---

## Completion Summary

- Task 01 approved.
- Tasks 02–08 in Review (pending user approval).
