# Task 06: Verification and Context Update

## Goal

Run final verification and update project documentation with the new Self-RAG current state.

## Scope

- Run targeted server tests.
- Run server build.
- Run client lint and build.
- Update `MASTER_PROJECT_REFERENCE.md`.
- Update this module plan completion summary.

## Completion Criteria

- Verification results are recorded.
- Project reference reflects Self-RAG architecture, metadata contract, config, and pitfalls.

## Test Cases

- `npm test -- self-rag-evaluator.service.spec.ts self-rag.service.spec.ts chat.service.spec.ts multi-query.service.spec.ts env.spec.ts --runInBand` from `server/`.
- `npm run build` from `server/`.
- `npm run lint` from `client/`.
- `npm run build` from `client/`.

## Review Gate

- Final response summarizes implementation and verification.
