# Task 06: Document List and Upload Hardening

## Goal

Improve document screen render performance and client-side upload safety.

## Scope

- Update `src/routes/app.documents.tsx`.
- Update `src/components/app/upload-dialog.tsx`.
- Avoid server API changes.

## Implementation Details

- Memoize document filtering and total chunk calculation so typing/searching and unrelated state updates do not redo work unnecessarily.
- Normalize search input once per render.
- Add client-side validation for allowed extensions and max file size before upload.
- Keep max size aligned with visible copy: `50 MB`.
- Show per-file validation failures without sending invalid files to the server.
- Consider upload concurrency control or sequential upload if multi-file uploads can overload the backend locally.
- Keep server validation authoritative.

## Completion Criteria

- Invalid file type/size is rejected before upload.
- Document filter and total chunk derivations are memoized.
- Existing upload success/error UI still works.

## Test Cases

- Run `npm run lint` from `client/`.
- Run `npm run build` from `client/`.
- Manual checks: valid `.pdf/.docx/.txt/.csv/.md`, invalid extension, file over 50 MB, multiple file selection.

## Review Gate

Stop after this task and wait for user review before starting Task 07.
