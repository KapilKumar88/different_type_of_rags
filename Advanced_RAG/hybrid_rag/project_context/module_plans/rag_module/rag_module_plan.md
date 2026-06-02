# Naive RAG Module Plan

## Purpose

This file is the lookup and status tracker for the learning-focused Naive RAG module. Detailed task instructions live in the task files in this folder.

Module scope is limited to:

- Document upload, extraction, chunking, embedding, and Qdrant storage.
- Document listing and deletion.
- Question answering over top-K retrieved chunks.
- React integration for the existing Upload, Documents, and Chat pages.

Out of scope for this version:

- LangGraph.
- Agents.
- Chat memory.
- Hybrid search.
- Reranking.
- Streaming responses.
- Queue-based ingestion.

## Status Legend

- `Pending`: Not started.
- `In Progress`: Implementation has started but is not ready for review.
- `Review`: Task is complete and waiting for user review.
- `Approved`: User reviewed and approved the task.

## Task Status

| Task | File | Status | Notes |
| --- | --- | --- | --- |
| Task 01: Planning and Task Files | [task_01.md](task_01.md) | Approved | User reviewed the plan and approved proceeding to Task 02. |
| Task 02: Server RAG Foundation | [task_02.md](task_02.md) | Approved | User reviewed and approved proceeding to Task 03. |
| Task 03: Server Infrastructure Services | [task_03.md](task_03.md) | Approved | User reviewed and approved proceeding to Task 04. |
| Task 04: Documents API and Ingestion Flow | [task_04.md](task_04.md) | Approved | User reviewed and approved proceeding to Task 05. |
| Task 05: Chat API Retrieval Flow | [task_05.md](task_05.md) | Approved | User reviewed and approved proceeding to Task 06. |
| Task 06: Client Document Integration | [task_06.md](task_06.md) | Approved | User reviewed and approved proceeding to Task 07. |
| Task 07: Client Chat Integration | [task_07.md](task_07.md) | Approved | User reviewed and approved proceeding to Task 08. |
| Task 08: Verification and Context Update | [task_08.md](task_08.md) | Approved | Final builds/tests passed; manual runtime blockers and project reference update recorded. |

## Key Decisions

- Use existing `/api/v1` route convention.
- Keep new RAG endpoints protected by the existing cookie JWT guard.
- Use Ollama embeddings model `nomic-embed-text:v1.5`.
- Use Qdrant collection `documents`.
- Use Qdrant vector size `768` and cosine distance.
- Use Ollama chat model `minimax-m2.5:cloud`.
- Use recursive character splitting with chunk size `800` and overlap `100`.
- Retrieve only top `5` chunks for each question.
- Store document metadata in Postgres and chunk vectors/text payloads in Qdrant.
- Keep ingestion synchronous for learning clarity.

## Strict Workflow

- Always read this lookup file before starting or resuming RAG module work.
- Always read the current task file before implementing that task.
- Complete tasks in numeric order.
- After completing a task, update this lookup file with the task status and notes.
- Do not implement future tasks early unless the user explicitly asks to continue without review gates.
- Do not add LangGraph, agents, memory, hybrid search, reranking, streaming, or queues in this module.

## Completion Summary

- Task 01 is approved.
- Task 02 is approved.
- Task 03 is approved.
- Task 04 is approved.
- Task 05 is approved.
- Task 06 is approved.
- Task 07 is approved.
- Task 08 is ready for review.
