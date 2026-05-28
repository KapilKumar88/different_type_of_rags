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

## Completion Notes

- Added compensating Qdrant cleanup when document metadata creation fails after vector upsert.
- Kept upload metadata creation blocked when Qdrant upsert fails.
- Kept delete ordering as Qdrant cleanup before metadata deletion so Qdrant failures leave database metadata untouched and retryable.
- Propagated metadata delete failures after Qdrant cleanup so callers can retry the idempotent Qdrant delete plus metadata delete path.
- Fixed a Jest-incompatible absolute helper import in `DocumentParsingService` discovered during verification.
- Added tests for:
  - Metadata creation failure after Qdrant upsert triggering vector cleanup.
  - Qdrant upsert failure preventing metadata creation.
  - Qdrant delete failure preserving metadata.
  - Successful retry after transient Qdrant delete failure.
  - Metadata delete failure propagation after Qdrant cleanup.
- Verification passed:
  - `npm run build`
  - `npm test -- documents.service.spec.ts --runInBand`
  - `npm test -- document-parsing.service.spec.ts document-upload-validation.pipe.spec.ts --runInBand`
