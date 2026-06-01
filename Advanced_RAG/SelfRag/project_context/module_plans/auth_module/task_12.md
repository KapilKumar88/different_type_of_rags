# Task 12: HTTP Security Headers

## Goal

Fix the post-test security issue where the server does not set standard HTTP security headers.

## Scope

- Install and configure Helmet for the NestJS server.
- Set clickjacking protection to `DENY`.
- Add e2e coverage for representative security headers.
- Keep existing auth and API response behavior unchanged.

## Implementation Details

- Use the official `helmet` middleware.
- Centralize security-header setup in a small bootstrap helper so `main.ts` and tests use the same configuration.
- Verify headers such as `X-Content-Type-Options`, `X-Frame-Options`, and `Content-Security-Policy`.

## Completion Criteria

- [x] Server responses include `X-Content-Type-Options: nosniff`.
- [x] Server responses include `X-Frame-Options: DENY`.
- [x] Server responses include a Content Security Policy header.
- [x] Existing server tests and build still pass.

## Test Cases

- `GET /` includes the configured security headers.
- Existing auth tests still pass after middleware is added.

## Review Gate

Stop after this task and wait for user review before implementing additional security hardening items.

## Implementation Notes

- Installed `helmet`.
- Added a shared `configureSecurityHeaders()` helper used by `main.ts` and e2e app setup.
- Configured frameguard with `DENY`.
- Added e2e assertions for representative Helmet headers.
