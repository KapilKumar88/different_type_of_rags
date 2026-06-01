# Task 02: Baseline Verification

## Goal

Confirm the restored server and existing client baseline are usable before changing RAG behavior.

## Scope

- Read the restored backend source and project config.
- Run focused baseline server tests for current query rewriting and chat behavior.
- Run server build.
- Record verification results in the module plan.

Out of scope:

- Multi-query implementation.
- Client UI/type changes.
- Master reference update.

## Implementation Details

- Use current query rewriting tests as a baseline check before replacing the implementation.
- If baseline tests fail due to unrelated pre-existing issues, record the exact failure and reassess before continuing.
- Do not modify feature code in this task unless a baseline blocker prevents any meaningful next step.

## Completion Criteria

- Server project config is present.
- Baseline query rewriting/chat tests have been attempted.
- Server build has been attempted.
- Module plan is updated with Task 02 status and notes.

## Test Cases

- `npm test -- query-rewriting.service.spec.ts --runInBand` from `server/`.
- `npm test -- chat.service.spec.ts --runInBand` from `server/`.
- `npm run build` from `server/`.

## Review Gate

Stop after this task and wait for explicit user approval before starting Task 03.
