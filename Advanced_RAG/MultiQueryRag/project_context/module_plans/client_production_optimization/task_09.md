# Task 09: Error Boundaries and Client Logging

## Goal

Make production failures visible and user-safe instead of falling through generic route behavior.

## Scope

- Add route-level error UI.
- Add a small structured client logger abstraction.
- Wire critical error paths without choosing a third-party monitoring vendor.

## Implementation Details

- Current router uses `NotFoundPage` as `errorElement`, which is not a true production error boundary experience.
- Add an app error boundary/page that can show a retry/navigation path.
- Add a client logger module with methods such as `info`, `warn`, and `error`.
- Start by logging API client failures, route boundary errors, and streaming errors.
- Do not log secrets, CSRF tokens, raw auth cookies, uploaded file content, or full document chunk text.
- Keep logging output environment-aware so production can later forward to a provider.

## Completion Criteria

- Route errors render a clear fallback instead of masquerading as 404.
- Error logging calls are structured and sanitized.
- Existing 404 behavior still works for unknown paths.

## Test Cases

- Run `npm run lint` from `client/`.
- Run `npm run build` from `client/`.
- Manual test an unknown route and a forced route error if practical.

## Review Gate

Stop after this task and wait for user review before starting Task 10.
