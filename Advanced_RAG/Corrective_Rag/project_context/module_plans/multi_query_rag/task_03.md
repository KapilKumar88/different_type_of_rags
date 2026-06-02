# Task 03: Multi-Query Service

## Goal

Replace the single-query rewriting service with a focused service that generates bounded multi-query retrieval metadata.

## Scope

- Add `server/src/services/multi-query/` as the replacement service.
- Generate query variants through the existing `LlmService`.
- Include the original query first.
- Parse and sanitize model output.
- Deduplicate queries while preserving order.
- Fall back to the original query on unusable output or dependency errors.
- Add focused unit tests.

Out of scope:

- Chat retrieval fan-out integration.
- Client display changes.
- Database schema changes.

## Implementation Details

- Output must be `RetrievalMetadata`.
- Metadata strategy must be `"multi_query"`.
- Metadata must include `originalQuery`, `generatedQueries`, `usedQueryCount`, `strategy`, and `createdAt`.
- The prompt must ask for a JSON array of concise search queries only.
- History is only for resolving references and broadening retrieval phrasing.
- Sanitization must support JSON arrays, fenced JSON, and newline fallback.
- Do not use `any`; define request/output/helper types explicitly.

## Completion Criteria

- Multi-query service and module exist.
- Query rewriting service/module references remain only where needed by the current chat integration until Task 04 replaces that flow.
- Unit tests cover successful generation, original-query inclusion, deduplication, malformed output fallback, blank output fallback, overlong output filtering, and thrown-error fallback.
- Module plan is updated with Task 03 status and notes.

## Test Cases

- `npm test -- multi-query.service.spec.ts --runInBand` from `server/`.

## Review Gate

Stop after this task and wait for explicit user approval before starting Task 04.
