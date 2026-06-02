# Task 01: Planning and Existing Flow Audit

## Goal

Create the Adaptive RAG module plan and audit the existing Naive RAG flow before any application code changes.

## Scope

- Read `project_context/MASTER_PROJECT_REFERENCE.md`.
- Read the client/server architecture guides and tech stack notes.
- Inspect the current server chat service, chat repository, Qdrant service, LLM service, embedding service, RAG config, conversation schema, and client chat stream contracts.
- Identify the smallest production-ready adaptive feature set that fits the existing application.
- Create this module planning folder and all task files.

## Implementation Details

- Existing backend flow:
  - `ChatService.streamConversationAnswer()` validates conversation ownership, loads the persisted user message, embeds the question, searches Qdrant by selected document IDs, emits `sources`, streams a single prompt through Ollama, persists the assistant message, and emits `done`.
  - Retrieval is already scoped to the selected conversation document IDs through `QdrantService.searchByDocumentIds()`.
  - Prompt construction already separates retrieved context, conversation history, and latest user message.
  - Existing fallback answer is centralized in `ragConfig.fallbackAnswer`.
- Existing client flow:
  - `chatService.streamMessage()` listens for `sources`, `token`, `done`, and `error` SSE events.
  - Assistant message UI displays retrieved chunks and supports retry on recoverable stream failures.
- Planned adaptive extension:
  - Add route/decision metadata, query rewrite attempts, graded retrieval, grounded answer validation, and trace display while keeping the endpoint and document scope stable.

## Completion Criteria

- `project_context/module_plans/adaptive_rag_flow/adaptive_rag_flow_plan.md` exists.
- `task_01.md` through `task_07.md` exist.
- Task 01 status is set to `Review` in the module plan.
- No application code has been changed.

## Test Cases

- Planning artifact verification only:
  - Confirm all planned task files exist.
  - Confirm the module plan has purpose, status legend, task table, key decisions, review gates, and completion summary.

## Review Gate

Stop after Task 01 and ask the user to review this plan. Do not start Task 02 until the user explicitly approves.
