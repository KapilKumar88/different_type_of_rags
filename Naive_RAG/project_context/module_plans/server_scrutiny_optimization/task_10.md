# Task 10: Tighten TypeScript Strictness

## Goal

Reduce hidden backend type risk by enabling stricter TypeScript checks in staged, verifiable steps.

## Scope

- Review relaxed `tsconfig.json` flags.
- Enable stricter checks where the current codebase can support them.
- Fix surfaced type errors.
- Document deferred flags if any remain.

## Implementation Details

- Prioritize `noImplicitAny`.
- Avoid broad type casts that only silence errors.

## Completion Criteria

- Stricter TypeScript settings are enabled or deliberately documented.
- Build and tests pass.

## Test Cases

- `npm run build`
- Targeted tests for touched areas.

## Review Gate

Stop after this task and wait for user review before starting Task 11.
