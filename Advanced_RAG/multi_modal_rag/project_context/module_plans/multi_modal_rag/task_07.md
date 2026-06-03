# Task 07: Tests, Builds, Documentation

## Goal

Cover the new behavior, keep the suite green, and document the module.

## Implementation Details

- Update `document-parsing.service.spec.ts` (image parser registered; `images: []`),
  `documents.service.spec.ts` (new constructor, doc-row-first flow, image ingestion,
  caption-failure resilience, unified rollback, image-only upload), and
  `chat.service.spec.ts` (new constructor, fused retrieval, modality-tagged sources,
  vision routing).
- Add `image-document.parser.spec.ts` and image-endpoint coverage in
  `documents.controller.spec.ts`.
- Run server build + full jest suite; client lint + build.
- Add this module plan and update `MASTER_PROJECT_REFERENCE.md`.

## Completion Criteria

- 17 server suites / 101 tests pass; server and client builds pass.

## Review Gate

All builds and tests green; reference doc updated.
