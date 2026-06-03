# Task 02 — `document_parents` schema + migration

## Goal
Add the parent-storage table and generate its migration. Schema-only; no code reads/writes it yet.

## Scope
- `server/src/database/schemas/document-parents.schema.ts` (new)
- `server/src/database/schemas/index.ts`
- `server/src/database/migrations/0004_*` (generated)

## Implementation Details
- `documentParents` pgTable: `id` uuid pk defaultRandom; `documentId` uuid notNull `references(() => documents.id, { onDelete: 'cascade' })`; `parentIndex` integer notNull (document-global ordinal); `text` **text** (not varchar); `pageNumber` integer nullable; `createdAt` timestamptz defaultNow notNull. Index on `documentId`.
- Export `DocumentParent` / `NewDocumentParent`.
- Register in `schemas/index.ts`.
- Run `npm run db:generate` (never hand-edit generated SQL/meta), then `npm run db:migrate`.

## Completion Criteria
- `0004_*.sql` contains `CREATE TABLE "document_parents"` with FK cascade + index.
- `npm run db:migrate` applies cleanly; build passes.

## Test Cases
- Migration applies against a local DB without error; table + index exist.

## Review Gate
Confirm columns (esp. `text` type, `parentIndex`, nullable `pageNumber`).
