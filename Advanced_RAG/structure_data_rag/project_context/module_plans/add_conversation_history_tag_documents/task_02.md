# Task 02: Conversation Database Schema

## Goal

Add the database schema and migration foundation for persisted conversations, fixed conversation-document links, and saved messages.

## Scope

- Add Drizzle schema definitions for:
  - `conversations`
  - `conversation_documents`
  - `conversation_messages`
- Export the new schema from the database schema index.
- Generate a Drizzle migration for the new tables.
- Keep existing `documents` and `users` table behavior unchanged.

## Implementation Details

- Store conversations with:
  - `id`
  - `userId`
  - `title`
  - `createdAt`
  - `updatedAt`
- Store conversation-document links with:
  - `conversationId`
  - `documentId`
  - `createdAt`
- Use a composite primary key on `conversationId` and `documentId` to prevent duplicate tags.
- Store messages with:
  - `id`
  - `conversationId`
  - `role` as `user` or `assistant`
  - `content`
  - `sources` as nullable JSON for assistant source chunks
  - `createdAt`
  - `updatedAt`
- Use foreign keys with cascade delete from conversations to links/messages.
- Use foreign keys from conversation-document links to documents.
- Do not add document ownership in this task unless the current codebase already has that pattern.

## Completion Criteria

- New schema file exists and compiles.
- New tables are exported from `src/database/schemas/index.ts`.
- A new migration file is generated and checked in.
- Migration creates all required tables and constraints.
- Existing migrations are not manually rewritten.

## Test Cases

- Run `npm run build` from `Naive_RAG/server`.
- Run `npm run db:generate` only if the migration has not already been generated.
- Inspect the generated SQL and confirm all three tables are present.
- Confirm duplicate document links are prevented by the composite primary key.

## Review Gate

After completing this task, update the lookup file, then stop unless the user explicitly approves Task 03.
