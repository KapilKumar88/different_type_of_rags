# Task 06: API and Client Integration

## Goal

Expose structured document metadata and render structured sources in the client.

## Scope

- Add `GET /api/v1/documents/:id/tables`.
- Add Swagger setup and endpoint decorators.
- Extend document and chat response contracts.
- Update upload dialog, documents page, and chat source rendering.

## Implementation Details

- Table preview endpoint returns table metadata and bounded preview rows.
- Client upload accepts `.json` and `.xlsx`.
- Documents page shows structured counts and opens a table preview dialog.
- Chat sources render text chunks and structured query results distinctly.

## Completion Criteria

- Client builds with updated source union types.
- New API endpoint validates ownership and returns stable errors.

## Test Cases

- Controller tests for table preview ownership, validation, and Swagger metadata.
- Client lint/build.

## Review Gate

Stop after API/client review.
