# Task 04: Data Model and Types

## Goal

Persist image bytes/metadata and add the modality-tagged retrieval types.

## Implementation Details

- New `database/schemas/document-images.schema.ts`: `document_images` table with a
  Drizzle `bytea` custom type for `data`, FK cascades to `documents` and `users`,
  and indexes on `document_id`/`user_id`. Export from `schemas/index.ts`.
- `documents.schema.ts`: add `image_count integer not null default 0`.
- `api/v1/documents/document-images.repository.ts`: create / find-by-id-for-user /
  find-by-ids-for-user.
- `types/rag.types.ts`: add `ImageVectorPayload`, `ImageVectorPoint`,
  `RetrievedImage`, and the `RetrievedSource` union. Widen
  `conversation_messages.sources` jsonb to `RetrievedSource[]`.
- Generate the Drizzle migration (`0004_*`).

## Completion Criteria

- Migration creates `document_images` and the `image_count` column; image rows
  cascade-delete with their document.

## Review Gate

`npm run db:generate` produces the migration; server build passes.
