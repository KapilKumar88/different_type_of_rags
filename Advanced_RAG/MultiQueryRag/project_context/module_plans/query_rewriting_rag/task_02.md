# Task 02: Backend Schema and Types

## Goal

Add backend storage and shared types for retrieval audit metadata while keeping existing conversation messages compatible.

## Scope

- Add a `RetrievalMetadata` server type with:
  - `originalQuery`
  - `rewrittenQuery`
  - `wasRewritten`
  - `strategy: "query_rewriting"`
  - `createdAt`
- Add nullable `retrieval_metadata` JSONB to `conversation_messages`.
- Update Drizzle schema types so `ConversationMessage` includes nullable `retrievalMetadata`.
- Add the corresponding migration files.
- Keep existing messages valid with `retrievalMetadata: null`.

Out of scope:

- Query rewriting prompt logic.
- Chat retrieval behavior changes.
- Client UI changes.

## Implementation Details

- Place RAG metadata types in the existing shared RAG type area.
- Use Drizzle JSONB typing instead of untyped objects.
- Name the database column `retrieval_metadata` and expose it as `retrievalMetadata` in application code.
- Prefer generating the migration with Drizzle Kit if local config permits it; otherwise add a minimal manual migration consistent with existing migration style.

## Completion Criteria

- Backend schema compiles with nullable retrieval metadata.
- Migration adds only the new nullable column.
- No existing conversation/message behavior is changed yet.
- Module plan is updated with Task 02 status and notes.

## Test Cases

- Run targeted backend type/build verification if feasible.
- Confirm old message fixtures/tests can use `retrievalMetadata: null` or omit it where type-compatible.

## Review Gate

Stop after this task and wait for explicit user approval before starting Task 03.
