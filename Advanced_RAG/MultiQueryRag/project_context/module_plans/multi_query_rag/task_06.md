# Task 06: Verification and Context Update

## Goal

Run final verification and update the project reference with the completed Multi-Query RAG state.

## Scope

- Run focused backend tests.
- Run server build.
- Run client lint/build.
- Update `project_context/MASTER_PROJECT_REFERENCE.md`.
- Update the module plan completion summary.

Out of scope:

- Runtime manual acceptance if Postgres, Qdrant, or Ollama are unavailable.
- New feature work.

## Implementation Details

- Record exact verification commands and outcomes.
- Update current-state docs to say Multi-Query RAG replaces Query Rewriting RAG.
- Document the new retrieval metadata contract and operational pitfalls.
- If manual acceptance cannot run due to unavailable services, say so explicitly.

## Completion Criteria

- Final verification commands have been run or documented as blocked.
- Master reference reflects the new current state.
- Module plan marks completed tasks and includes final summary.

## Test Cases

- `npm test -- multi-query.service.spec.ts --runInBand` from `server/`.
- `npm test -- chat.service.spec.ts --runInBand` from `server/`.
- `npm run build` from `server/`.
- `npm run lint` from `client/`.
- `npm run build` from `client/`.

## Review Gate

Stop after this task and ask for final user review.
