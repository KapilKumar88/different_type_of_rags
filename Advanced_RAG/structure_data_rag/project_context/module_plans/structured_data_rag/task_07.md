# Task 07: Verification and Context Update

## Goal

Verify the full Structured Data RAG module and update project reference documentation.

## Scope

- Run server build/tests.
- Run client lint/build.
- Confirm migration generation.
- Update `project_context/MASTER_PROJECT_REFERENCE.md`.

## Implementation Details

- Record any manual runtime blockers for Postgres, Qdrant, or Ollama.
- Document new API contracts, config, schema, and known limitations.

## Completion Criteria

- Verification commands are recorded with pass/fail status.
- Master project reference accurately describes the new current state.

## Test Cases

- `npm run build` from `server/`.
- `npm test -- --runInBand` from `server/`.
- `npm run lint` and `npm run build` from `client/`.

## Review Gate

Final module review.
