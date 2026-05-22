# Task 05: Add Postgres/Qdrant Consistency Strategy

## Goal

Avoid orphan Qdrant vectors and stale Postgres metadata when document upload or delete partially fails.

## Scope

- Define upload/delete ordering and compensation.
- Add cleanup for failed upload vector writes or failed metadata writes.
- Add retry-safe delete behavior.

## Implementation Details

- Choose between transactional metadata plus compensating Qdrant cleanup, or an indexed-status/outbox model.
- Keep behavior idempotent where possible.

## Completion Criteria

- Partial upload/delete failures leave a recoverable state.
- Tests cover Qdrant failure and database failure paths.

## Test Cases

- Metadata write failure after Qdrant upsert triggers vector cleanup.
- Qdrant delete failure does not silently remove database state.
- Retrying delete is safe.

## Review Gate

Stop after this task and wait for user review before starting Task 06.
