# Task 06: Verification and Regression Coverage

## Goal

Run the full practical verification set for the Adaptive RAG module and record any runtime limitations.

## Scope

- Run focused server unit tests for adaptive runtime and chat integration.
- Run server build.
- Run client lint and build.
- Run broader server tests when feasible.
- Document manual runtime checks that require Postgres, Qdrant, and Ollama.

## Implementation Details

- Prefer focused test commands first so failures are attributable.
- If a command fails because local runtime services are unavailable, record that explicitly rather than masking it.
- Do not brute-force blocked runtime checks.
- Update the module plan with exact commands and outcomes.

## Completion Criteria

- Verification commands and outcomes are documented.
- Any residual risk or manual runtime blocker is documented.
- Module plan task status and notes are updated.

## Test Cases

- Server focused adaptive specs.
- Server focused chat specs.
- `npm run build` from `server/`.
- `npm run lint` from `client/`.
- `npm run build` from `client/`.
- Broader `npm test -- --runInBand` from `server/` if feasible.

## Review Gate

Stop after Task 06 and ask the user for review before updating the master project reference.

## Completion Notes

- Focused backend verification passed:
  - `npm test -- adaptive-rag.service.spec.ts chat.service.spec.ts chat.controller.spec.ts env.spec.ts --runInBand`
  - `npm run build`
- Broader backend verification passed:
  - `npm test -- --runInBand`
- Client verification passed:
  - `npm run lint` passed with the existing Fast Refresh warnings only.
  - `npm run build` passed.
- Manual Adaptive RAG runtime smoke was not run because it requires live Postgres, Qdrant, and Ollama services with configured models.
