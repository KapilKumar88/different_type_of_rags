# Task 03: Server Infrastructure Services

## Goal

Create reusable backend modules for Qdrant, embeddings, and LLM calls.

## Scope

- Add `QdrantModule`.
- Add `EmbeddingsModule`.
- Add `LlmModule`.
- Keep these modules infrastructure-focused with no document or chat controller logic.

## Implementation Details

- Add `server/src/api/v1/qdrant/qdrant.module.ts` and service files.
- Add `server/src/api/v1/embeddings/embeddings.module.ts` and service files.
- Add `server/src/api/v1/llm/llm.module.ts` and service files.
- `QdrantService` must:
  - Create a Qdrant client from typed config.
  - Ensure the configured collection exists.
  - Use vector size `768`.
  - Use cosine distance.
  - Upsert chunk points.
  - Search by query vector.
  - Delete points by `documentId` payload filter.
- `EmbeddingsService` must:
  - Wrap Ollama embeddings through LangChain.
  - Generate one vector for documents or questions.
  - Validate that returned vector length matches config.
- `LlmService` must:
  - Wrap Ollama chat generation.
  - Accept a final prompt string.
  - Return answer text.

## Completion Criteria

- Each infrastructure module is importable and exports its service.
- Qdrant collection creation is centralized.
- Embedding dimension validation exists.
- LLM calls are centralized.
- No LangGraph dependency or usage exists.

## Test Cases

- Run `npm run build` from `Naive_RAG/server`.
- Add focused unit tests for dimension validation or prompt-independent service behavior where practical.
- Search the server source and confirm `LangGraph` is not referenced.

## Review Gate

After completing this task, update `rag_module_plan.md`, then continue or stop according to the user's requested workflow.
