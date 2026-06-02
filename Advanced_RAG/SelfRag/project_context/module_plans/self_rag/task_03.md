# Task 03: Backend Self-RAG Services

## Goal

Add backend Self-RAG types, config, evaluator service, orchestration service, module wiring, and focused service tests.

## Scope

- Extend server RAG metadata types with a backward-compatible union.
- Add typed Self-RAG config defaults.
- Implement strict JSON evaluator parsing with graceful degradation.
- Implement Self-RAG orchestration with multi-query retrieval, relevance filtering, answer grading, and one retry.

## Implementation Details

- Keep Multi-Query service as query generation input.
- Use existing embeddings, Qdrant, LLM, and RAG runtime limiter services.
- Treat retrieved context and conversation history as untrusted prompt content.
- Do not add new database tables or migrations.

## Completion Criteria

- Self-RAG services compile and have focused unit tests.
- Evaluator failures do not throw through the stream path.

## Test Cases

- `self-rag-evaluator.service.spec.ts`
- `self-rag.service.spec.ts`
- `env.spec.ts`

## Review Gate

- Continue to Task 04 because the user explicitly requested implementation of the full plan.
