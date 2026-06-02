# Task 09: Server-Side Logout

## Goal

Fix the post-test security issue where signing out only clears client state while the HttpOnly auth cookie remains valid.

## Scope

- Add a server logout endpoint.
- Clear the auth cookie using the same cookie identity options used when setting it.
- Wire the client sidebar sign-out action to call the server endpoint.
- Add focused server tests for the endpoint and cookie clearing behavior.

## Implementation Details

- Add `POST /api/v1/auth/logout`.
- Keep logout idempotent so clients can clear stale or expired cookies without first passing the auth guard.
- Return the standard API shape: `{ success, message, data }`.
- Add `authService.logout()` on the client.
- Replace the sidebar sign-out link with an action that calls the endpoint before clearing Zustand auth state and navigating to `/login`.

## Completion Criteria

- [x] Clicking Sign out clears the server auth cookie.
- [x] Reloading or revisiting protected routes after sign-out sends the user to `/login`.
- [x] Existing login, registration, and `/me` behavior remains unchanged.
- [x] Server unit/e2e tests cover the logout response and cookie clearing header.

## Test Cases

- `POST /api/v1/auth/logout` returns `200` with a successful response body.
- `POST /api/v1/auth/logout` emits a `Set-Cookie` header that expires `rag_auth_token`.
- The client sign-out action calls the logout endpoint before clearing local auth state.

## Review Gate

Stop after this task and wait for user review before implementing additional security hardening items.

## Implementation Notes

- Added `POST /api/v1/auth/logout` as an idempotent public endpoint that clears the configured auth cookie.
- Added `authService.logout()` and wired the sidebar sign-out item to call it before clearing local auth state.
- Verified with focused controller tests, auth e2e tests, server build, client build, and client lint.
