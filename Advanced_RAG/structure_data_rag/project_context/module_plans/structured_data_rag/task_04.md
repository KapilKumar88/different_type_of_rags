# Task 04: Ingestion Persistence

## Goal

Persist structured artifacts during upload and index semantic table summaries.

## Scope

- Store structured tables, columns, and rows in Postgres.
- Update document summary counts and content kind.
- Upsert Qdrant points for text chunks and table summaries.
- Add cleanup/compensation on partial failures.

## Implementation Details

- Do not embed every row by default.
- Include vector payload kind fields so retrieval can distinguish text chunks from table summaries.
- Keep upload limits and add structured row/table limits.

## Completion Criteria

- Uploads with structured content create document metadata, structured rows, and Qdrant summary points.
- Delete removes Qdrant points and cascades structured Postgres rows.

## Test Cases

- Upload service tests for structured-only, hybrid text/table, too-many-rows, DB failure cleanup, and deletion retry behavior.

## Review Gate

Stop after ingestion review.
