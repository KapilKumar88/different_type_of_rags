# Task 04: Chat Flow Integration

## Goal

Integrate query rewriting into the existing document-scoped chat retrieval and streaming flow.

## Scope

- Inject the query rewriting service into the chat module.
- Load bounded conversation history before retrieval.
- Generate `retrievalMetadata` before embedding.
- Embed `retrievalMetadata.rewrittenQuery`, not the raw user message.
- Search Qdrant only within selected conversation document IDs.
- Emit `sources` SSE events as `{ sources, retrievalMetadata }`.
- Persist assistant messages with both `sources` and `retrievalMetadata`.
- Keep final answer prompts using the original latest user message.
- Keep existing stable stream errors and fallback answer behavior.

Out of scope:

- Client rendering of retrieval metadata.
- New public endpoints.
- Hybrid search/reranking.

## Implementation Details

- Refactor retrieval helpers so the same rewrite-aware path is used for streaming and any remaining answer-context helper.
- Keep ownership validation before message lookup and retrieval.
- Keep the concurrency limiter around expensive LLM, embedding, and Qdrant operations.
- Persist retrieval metadata even when no sources are found and the fallback answer is used.

## Completion Criteria

- Chat retrieval embeds the rewritten query.
- Final answer generation still receives the original user message.
- SSE `sources` event includes metadata.
- Assistant messages persist metadata.
- Module plan is updated with Task 04 status and notes.

## Test Cases

- Chat service embeds `rewrittenQuery` and not `originalQuery`.
- Final prompt includes the original latest user message.
- `sources` stream event contains `sources` and `retrievalMetadata`.
- Empty-source fallback persists retrieval metadata.
- Retrieval failure still emits a stable public stream error.

## Review Gate

Stop after this task and wait for explicit user approval before starting Task 05.
