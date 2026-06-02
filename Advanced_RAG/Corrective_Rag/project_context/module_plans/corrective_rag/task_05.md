# Task 05: Verification and Reference Update

## Goal

Verify the full conversion and update project documentation.

## Scope

- Run targeted server tests and builds.
- Run client lint/build.
- Update `MASTER_PROJECT_REFERENCE.md`.
- Update this module plan status and completion summary.

## Implementation Details

- Record exact verification commands and any limitations.
- Document Tavily env vars and runtime requirements.
- Document legacy metadata compatibility.

## Completion Criteria

- Required verification passes or failures are documented with cause.
- Project reference reflects Corrective RAG as the active path.
- Corrective RAG module plan has final task statuses and summary.

## Test Cases

- `npm test -- corrective-rag-evaluator.service.spec.ts corrective-rag.service.spec.ts tavily-web-search.service.spec.ts chat.service.spec.ts multi-query.service.spec.ts env.spec.ts --runInBand` from `server/`.
- `npm run build` from `server/`.
- `npm run lint` from `client/`.
- `npm run build` from `client/`.

## Review Gate

Present final outcome and any residual risk to the user.
