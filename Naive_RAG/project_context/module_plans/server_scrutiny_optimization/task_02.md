# Task 02: Enforce Document Ownership

## Goal

Prevent authenticated users from listing, selecting, querying, or deleting documents owned by other users.

## Scope

- Add `documents.userId` with a foreign key to `users.id`.
- Update migrations and schema types.
- Pass `CurrentUser` through document endpoints.
- Scope document repository methods by `userId`.
- Validate chat conversation document selection against the authenticated user's documents only.

## Implementation Details

- Handle existing local rows deliberately during migration.
- Keep document ownership enforced in repository queries, not only service checks.
- Add tests for cross-user list, select, and delete attempts.

## Completion Criteria

- Document APIs only operate on the authenticated user's documents.
- Conversation document selection rejects documents not owned by the requester.
- Build and targeted tests pass.

## Test Cases

- User A cannot list User B's document.
- User A cannot delete User B's document.
- User A cannot create or update a conversation with User B's document ID.

## Review Gate

Stop after this task and wait for user review before starting Task 03.
