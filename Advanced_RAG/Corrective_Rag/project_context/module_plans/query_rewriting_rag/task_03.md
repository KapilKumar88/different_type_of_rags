# Task 03: Query Rewriting Service

## Goal

Implement the focused backend service that rewrites the latest user message into a standalone retrieval query.

## Scope

- Add a shared RAG service/module for query rewriting under `server/src/services/`.
- Use the existing Ollama chat model through the existing LLM abstraction or a small dedicated wrapper.
- Build a prompt that separates system rewrite rules from untrusted history and user message text.
- Bound conversation history used for rewriting.
- Sanitize model output by trimming quotes/code fences and collapsing whitespace.
- Return fallback metadata using the original query on failure or unusable output.
- Add unit tests for rewrite success, output cleanup, and fallback cases.

Out of scope:

- Chat service integration.
- Database persistence.
- Client display changes.

## Implementation Details

- The service output must be `RetrievalMetadata`.
- The rewrite prompt must ask for one concise search query only.
- History is only for resolving references like "that", "this", or "the previous method".
- The service must catch model errors and degrade gracefully to the original user query.
- Do not use `any`; define request/output types explicitly.

## Completion Criteria

- Query rewriting service and module exist.
- Unit tests cover normal rewrite, empty output fallback, thrown-error fallback, and output sanitization.
- Module plan is updated with Task 03 status and notes.

## Test Cases

- Rewrites a contextual follow-up into a standalone query.
- Removes wrapping quotes and code fences from model output.
- Falls back to original query when the model returns blank output.
- Falls back to original query when the model throws.

## Review Gate

Stop after this task and wait for explicit user approval before starting Task 04.
