# Task 06: Verification and Context Update

## Goal

Run focused verification and update project documentation after Query Rewriting RAG is fully implemented.

## Scope

- Run backend query rewriting service tests.
- Run chat service tests.
- Run server build.
- Run client lint and build.
- Update `project_context/MASTER_PROJECT_REFERENCE.md` with the new current state, API/type changes, verification commands, and pitfalls.
- Update this module plan with final task statuses and completion summary.

Out of scope:

- Manual runtime acceptance requiring Postgres, Qdrant, and Ollama unless those services are available.
- Additional RAG variants.

## Implementation Details

- Prefer targeted tests first, then builds.
- If a verification command fails, inspect the root cause before retrying.
- Document any environment blockers explicitly in both the final response and project reference.

## Completion Criteria

- Verification commands have been run or blockers are documented.
- `MASTER_PROJECT_REFERENCE.md` accurately reflects Query Rewriting RAG.
- Module plan completion summary is updated.
- No unrelated generated/runtime output is staged or modified intentionally.

## Test Cases

- `npm test -- chat.service.spec.ts --runInBand` from `server/`.
- Query rewriting service spec from `server/`.
- `npm run build` from `server/`.
- `npm run lint` from `client/`.
- `npm run build` from `client/`.

## Review Gate

Stop after this task and wait for final user review of the completed module.
