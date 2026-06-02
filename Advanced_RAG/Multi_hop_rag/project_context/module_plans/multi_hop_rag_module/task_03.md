# Task 03: Schema Metadata Column and Migration

## Goal

Add a `metadata` jsonb column to the `conversation_messages` table to persist the multi-hop trace alongside the assistant message, and generate the corresponding Drizzle migration.

## Scope

- `server/src/database/schemas/conversations.schema.ts` — add `metadata` column.
- Run `npm run db:generate` — generates `0004_*.sql` migration and meta snapshot.
- No application-logic files are changed in this task.

## Implementation Details

### conversations.schema.ts change

Import `MultiHopStep` from `../../types/rag.types` and add a `metadata` column to `conversationMessages`:

```ts
import type { MultiHopStep } from '../../types/rag.types';

export type MessageMetadata = {
  hops?: MultiHopStep[];
};

// Inside conversationMessages table:
metadata: jsonb('metadata').$type<MessageMetadata | null>(),
```

The column is nullable so existing rows and the user message (which has no hops) require no default value.

### Migration

Run `npm run db:generate` from `server/` after the schema change. Drizzle Kit emits a new migration file. Do not hand-write the SQL.

## Completion Criteria

- `conversations.schema.ts` exports `MessageMetadata` type and has the `metadata` column.
- `npm run db:generate` from `server/` succeeds and produces a new migration file under `server/src/database/migrations/`.
- `npm run build` from `server/` passes.

## Test Cases

- Run `npm run db:generate` from `server/` and confirm a new migration file appears.
- Run `npm run build` from `server/`.
- Run `npm test -- --runInBand` from `server/` and confirm all existing tests still pass.

## Review Gate

After completing this task, update `multi_hop_rag_module_plan.md` task status to `Review`, then stop and wait for user approval before starting Task 04.
