# Task 07: Runtime Config and API Resilience

## Goal

Harden browser runtime behavior for production API usage and failure handling.

## Scope

- Update client config helpers.
- Update API client and endpoint helpers.
- Avoid changing backend contracts.

## Implementation Details

- Replace silent production fallback to `http://localhost:3000` with explicit typed validation or a production-only failure path.
- Keep local development ergonomics intact.
- Encode dynamic path segments like document IDs, conversation IDs, and message IDs.
- Add request timeout/abort support to the fetch client.
- Ensure CSRF retry behavior still works after timeout/abort changes.
- Consider central `ApiClientError` metadata that a client logger can consume later.
- Handle Clipboard API failures where copy actions are used.

## Completion Criteria

- Production builds cannot silently point to localhost when `VITE_API_BASE_URL` is missing.
- Dynamic endpoint IDs are URL-encoded.
- API requests can timeout or be aborted predictably.
- Existing auth, document, chat, and CSRF flows compile unchanged at the service contract level.

## Test Cases

- Run `npm run lint` from `client/`.
- Run `npm run build` from `client/`.
- Test missing `VITE_API_BASE_URL` behavior in production mode.
- Manual API checks with login, upload, list, delete, chat stream when backend is available.

## Review Gate

Stop after this task and wait for user review before starting Task 08.
