# Task 02: Baseline Verification

## Goal

Run narrow existing verification before modifying the implementation.

## Scope

- Run existing Multi-Query and Chat service specs where feasible.
- Note failures before implementation.

## Implementation Details

- Use targeted server tests to confirm the existing behavior baseline.
- Do not modify source code during this task.

## Completion Criteria

- Baseline command result is recorded in `self_rag_plan.md`.

## Test Cases

- `npm test -- multi-query.service.spec.ts chat.service.spec.ts --runInBand` from `server/`.

## Review Gate

- Continue to Task 03 because the user explicitly requested implementation of the full plan.
