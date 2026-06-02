# Task 03: Descriptive Generated Conversation Titles

## Goal

Implement IMP-07 so new multi-document conversations receive useful default titles instead of `N documents`.

## Scope

- Client conversation creation title generation.
- No database schema change.
- No rename endpoint yet; that is Task 04.

## Implementation Details

- Add a small title helper near the chat route or in a focused chat utility file.
- For one document, keep the current filename title.
- For multiple documents, build a title from the first document base names, such as `flight_ops + test_doc`.
- Truncate the generated title around 40 characters with an ellipsis if needed.
- Keep a fallback like `N documents` only when document metadata is unavailable.

## Completion Criteria

- New two-document chats no longer default to `2 documents` when filenames are available.
- Generated titles fit in the sidebar without layout overflow.
- Existing conversations keep their stored titles.

## Test Cases

- Client build: `npm run build` from `client/`.
- Manual check: create a two-document conversation and confirm a compound title appears.
- Manual check: create a one-document conversation and confirm the filename remains the title.

## Review Gate

Stop after this task and wait for user review before starting Task 04.
