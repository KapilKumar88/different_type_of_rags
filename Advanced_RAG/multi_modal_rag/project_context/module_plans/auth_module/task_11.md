# Task 11: Auth Endpoint Rate Limiting

## Goal

Fix the post-test security issue where login and registration endpoints allow unlimited requests.

## Scope

- Add official NestJS throttling support.
- Apply throttling only to auth credential-entry endpoints for this task.
- Keep existing auth response contracts intact.
- Add focused tests proving rate-limit rejection.

## Implementation Details

- Install and configure `@nestjs/throttler`.
- Add typed rate-limit config values with conservative defaults.
- Apply the throttler guard and route-specific throttling to `POST /api/v1/auth/login` and `POST /api/v1/auth/register`.
- Keep `/me` and `/logout` outside this task's throttle scope.

## Completion Criteria

- [x] Login is rate-limited.
- [x] Registration is rate-limited.
- [x] Existing auth success/failure behavior remains unchanged below the limit.
- [x] E2E tests cover `429` responses for login and registration.

## Test Cases

- Five invalid login attempts return the existing credential failure response.
- The sixth login attempt from the same client returns `429`.
- Five registration attempts are accepted below the limit.
- The sixth registration attempt from the same client returns `429`.

## Review Gate

Stop after this task and wait for user review before implementing additional security hardening items.

## Implementation Notes

- Installed `@nestjs/throttler`.
- Added typed auth rate-limit settings with defaults of 5 requests per 60 seconds.
- Applied `ThrottlerGuard` and route-level `@Throttle()` to `POST /api/v1/auth/login` and `POST /api/v1/auth/register`.
- Added auth e2e coverage for `429` responses after too many login and registration attempts.
