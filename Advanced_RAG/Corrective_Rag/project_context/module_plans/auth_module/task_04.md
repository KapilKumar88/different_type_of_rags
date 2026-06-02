# Task 04: Server Auth Guard

## Goal

Add reusable backend auth guard support for cookie-based JWT authentication.

## Scope

- Add JWT auth guard.
- Add `@Public()` decorator.
- Add `@CurrentUser()` decorator.
- Add cookie JWT extraction.
- Wire the guard so protected routes can require auth.

## Implementation Details

- Keep guard-related files under `server/src/guard`.
- Add `JwtAuthGuard` that:
  - Reads JWT from the configured auth cookie.
  - Verifies the JWT.
  - Loads or attaches the current user identity to the request.
  - Throws `401` for missing, invalid, or expired cookies.
- Add `@Public()` decorator to mark endpoints that bypass auth.
- Add `@CurrentUser()` decorator for accessing the authenticated user in controllers.
- Keep register and login public.
- Keep `/me` protected.
- Prefer project-wide guard wiring once the public decorator is available.

## Completion Criteria

- Protected endpoints reject unauthenticated requests with `401`.
- Public endpoints remain reachable without a cookie.
- `/me` uses guard-provided user context rather than trusting client input.
- Guard logic is reusable by future modules.
- No role/permission behavior is added.

## Test Cases

- Unit test guard rejects requests without the auth cookie.
- Unit test guard rejects invalid or expired JWTs.
- Unit test guard allows requests with valid cookie JWTs.
- Unit test `@Public()` bypasses auth.
- Unit test `@CurrentUser()` extracts the request user.
- E2E test `/api/v1/auth/me` returns `401` without cookie.
- E2E test `/api/v1/auth/me` returns `200` with cookie.
- Run `npm run build` from `Naive_RAG/server`.
- Run `npm test -- --runInBand` from `Naive_RAG/server`.

## Review Gate

After completing this task, update `auth_module_plan.md`, stop, and ask the user to review before Task 05.
