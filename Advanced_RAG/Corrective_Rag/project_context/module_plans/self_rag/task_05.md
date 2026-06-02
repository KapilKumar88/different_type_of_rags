# Task 05: Client Trace Panel

## Goal

Render detailed Self-RAG metadata while preserving old Multi-Query audit display.

## Scope

- Extend client retrieval metadata types.
- Add a detailed expandable Self-RAG trace panel in chat message rendering.
- Keep source chunk display behavior.

## Implementation Details

- `strategy: "multi_query"` uses the current compact query audit.
- `strategy: "self_rag"` shows attempts, accepted/rejected chunk counts, chunk verdicts, refinement query, and answer support/utility.

## Completion Criteria

- Client builds with new metadata union.
- UI remains compact by default with expandable details.

## Test Cases

- `npm run lint` from `client/`.
- `npm run build` from `client/`.

## Review Gate

- Continue to Task 06 because the user explicitly requested implementation of the full plan.
