# Task 02: Structured Schemas and Types

## Goal

Add persistent schema and shared TypeScript contracts for structured data artifacts.

## Scope

- Add Drizzle tables for structured tables, columns, and rows.
- Add document summary fields for structured content kind/counts.
- Add structured RAG source, table, row, and query-plan types.
- Generate a Drizzle migration.

## Implementation Details

- Enforce database-level foreign keys with cascade cleanup from documents to structured artifacts.
- Store row values as JSONB keyed by stable column keys.
- Keep table/column/row ownership implicit through the parent document and validate ownership in repositories.

## Completion Criteria

- Schemas export from `server/src/database/schemas/index.ts`.
- Migration creates the new tables and document metadata fields.
- TypeScript shared types compile without `any`.

## Test Cases

- `npm run build` from `server/`.
- Schema/repository unit coverage for ownership-scoped table lookup.

## Review Gate

Stop after schema and migration review.
