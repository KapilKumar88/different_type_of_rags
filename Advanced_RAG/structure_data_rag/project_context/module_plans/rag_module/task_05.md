# Task 05: Chat API Retrieval Flow

## Goal

Implement the Naive RAG question-answering endpoint.

## Scope

- Add `ChatModule`.
- Add chat controller, service, DTO, and response types.
- Implement `POST /api/v1/chat/ask`.

## Implementation Details

- Validate request body with Zod:
  - `question`: non-empty string.
- Retrieval flow:
  - Generate an embedding for the question.
  - Search Qdrant collection `documents`.
  - Retrieve top `5` chunks.
  - Send only those chunks to the LLM.
- Use the exact prompt:

```text
You are a helpful assistant. Answer the user's question using only the provided context. If the answer is not available in the context, say: I could not find this information in the uploaded document.

Context:
{context}

Question:
{question}

Answer:
```

- Response data must include:
  - `answer`
  - `sources`
- Each source must include:
  - `chunkId`
  - `documentId`
  - `fileName`
  - `text`
  - `pageNumber` when available
  - `score`
- Add short comments in the service explaining the Naive RAG query steps.

## Completion Criteria

- Chat endpoint returns an answer and source chunks.
- Only top-5 retrieved chunks are included in the LLM prompt.
- Empty retrieval produces the required fallback answer without hallucinated context.
- API response follows `{ success, message, data }`.

## Test Cases

- Run `npm run build` from `Naive_RAG/server`.
- Add service tests with mocked embeddings, Qdrant search, and LLM response.
- Test that the prompt contains retrieved context and question.
- Test that no-source retrieval returns the required fallback sentence.

## Review Gate

After completing this task, update `rag_module_plan.md`, then continue or stop according to the user's requested workflow.
