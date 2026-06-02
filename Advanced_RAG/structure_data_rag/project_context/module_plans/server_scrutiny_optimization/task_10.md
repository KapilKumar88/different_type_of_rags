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

## Completion Notes

- Enabled `noImplicitAny`.
- Enabled `strictBindCallApply`.
- Enabled `noFallthroughCasesInSwitch`.
- Confirmed these stricter checks are supported by the current backend build without new suppressions or broad casts.
- No Task 10 strictness flags were deferred.

## Verification

- `npx tsc -p tsconfig.build.json --noEmit --noImplicitAny true --strictBindCallApply true --noFallthroughCasesInSwitch true` from `server/` passed before changing config.
- `npm run build` from `server/` passed.
- `npm test -- openapi.spec.ts chat.service.spec.ts documents.service.spec.ts --runInBand` from `server/` passed with `3` suites and `44` tests.
