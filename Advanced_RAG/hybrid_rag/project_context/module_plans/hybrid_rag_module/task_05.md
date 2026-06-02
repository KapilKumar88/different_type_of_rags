# Task 05: Verification and Reference Update

## Goal

Verify the Hybrid RAG implementation and update the master project reference.

## Scope

- Run focused server tests.
- Run server build.
- Run client lint and build.
- Update module plan statuses and `MASTER_PROJECT_REFERENCE.md`.

## Implementation Details

- Record any runtime blockers, especially external Qdrant/Ollama availability.
- Keep generated/runtime output unstaged and ignored.
- Document new configs and source payload contract.

## Completion Criteria

- Verification commands are run or blockers are documented.
- Project reference reflects current Hybrid RAG behavior.
- Module plan status table is updated.

## Test Cases

- `npm test -- qdrant.service.spec.ts documents.service.spec.ts chat.service.spec.ts --runInBand`
- Additional new focused specs for vectorizer/retriever.
- `npm run build` from `server/`
- `npm run lint` and `npm run build` from `client/`

## Review Gate

Stop for final review after this task.
