# Task 10: Remove Hardcoded Database Credential Default

## Goal

Fix the post-test security issue where `DATABASE_URL` had a source-code fallback containing predictable database credentials.

## Scope

- Remove the application-source default database URL.
- Ensure local `.env` values are loaded before typed config validation.
- Keep real environment variables higher priority than `.env` values.
- Add focused config tests.
- Keep existing auth behavior unchanged.

## Implementation Details

- Refactor server env parsing into a testable parser.
- Require `DATABASE_URL` in the Zod schema.
- Add a small config-local `.env` reader to avoid introducing a new dependency for this narrow change.
- Add Jest setup defaults for test runs only.
- Keep production validation for `JWT_SECRET` and require `DATABASE_URL` in all environments.

## Completion Criteria

- [x] `server/src/config/env.ts` no longer contains a default database connection string.
- [x] The app can read `DATABASE_URL` from the server `.env` file.
- [x] Explicit process environment values override `.env` values.
- [x] Tests prove missing `DATABASE_URL` fails validation.
- [x] Existing auth verification still passes.

## Test Cases

- Missing `DATABASE_URL` is rejected.
- `.env` values are read.
- Existing environment variables are not overwritten by `.env`.
- Server build and auth tests still pass.

## Review Gate

Stop after this task and wait for user review before implementing additional security hardening items.

## Implementation Notes

- Removed the source-code `DATABASE_URL` default from server config.
- Added config-local `.env` file loading while keeping real environment variables highest priority.
- Added test-only environment setup for Jest so tests provide explicit database and JWT values.
- Added focused config tests for required `DATABASE_URL`, `.env` parsing, and override precedence.
