# Task 14: CSRF Protection

## Goal

Add CSRF protection for cookie-authenticated mutating requests beyond the existing `SameSite=Lax` cookie setting.

## Scope

- Add a server endpoint to issue CSRF tokens.
- Protect unsafe HTTP methods with the double-submit cookie pattern.
- Update the shared client API wrapper to send CSRF tokens for mutating requests.
- Keep GET requests and existing API response contracts unchanged.

## Implementation Details

- Use the official NestJS-recommended `csrf-csrf` package for Express.
- Add `GET /api/v1/csrf-token` as a public endpoint that returns `{ csrfToken }`.
- Register CSRF middleware after `cookieParser()`.
- Cache CSRF tokens client-side and invalidate them after auth session changes.
- Retry once with a fresh CSRF token when the server rejects a stale token.

## Completion Criteria

- [x] Mutating requests without a CSRF token are rejected.
- [x] Mutating requests with a valid CSRF token succeed.
- [x] Client write requests automatically include `X-CSRF-Token`.
- [x] Existing auth and server verification pass.

## Test Cases

- `GET /api/v1/csrf-token` returns a token and sets the CSRF cookie.
- `POST /api/v1/auth/login` without a token returns `403`.
- `POST /api/v1/auth/login` with a token keeps existing validation behavior.
- Client build and lint pass after API wrapper changes.

## Review Gate

Stop after this task and wait for user review before implementing additional security hardening items.

## Implementation Notes

- Installed `csrf-csrf`.
- Added `GET /api/v1/csrf-token` to issue double-submit CSRF tokens.
- Registered CSRF protection after `cookieParser()`.
- Added typed CSRF config and production fail-fast validation for `CSRF_SECRET`.
- Updated the shared client API wrapper to fetch/cache/send `X-CSRF-Token` for unsafe methods and retry once on stale-token rejection.
- Added e2e coverage for token issuance, missing-token rejection, and valid-token auth flows.
