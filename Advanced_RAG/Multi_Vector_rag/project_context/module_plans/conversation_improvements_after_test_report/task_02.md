# Task 02: Header Upload Document Refresh

## Goal

Fix IMP-01 so documents uploaded from the app header appear in the chat document picker without a page refresh.

## Scope

- Client-only change in `client/src/components/app/app-header.tsx`.
- Wire the existing `UploadDialog` `onUploaded` callback.
- Invalidate the existing `["documents"]` TanStack Query key after upload.

## Implementation Details

- Import `useQueryClient` from `@tanstack/react-query`.
- Create `const queryClient = useQueryClient()` inside `AppHeader`.
- Pass `onUploaded={() => queryClient.invalidateQueries({ queryKey: ["documents"] })}` to `UploadDialog`.
- Do not change upload service behavior.

## Completion Criteria

- Uploading a document from the header refreshes the document list used by chat.
- Uploading from the Documents page still refreshes correctly.
- No new query key is introduced for documents.

## Test Cases

- Client build: `npm run build` from `client/`.
- Manual check: upload from header, open New chat, confirm new document appears.
- Manual regression: upload from Documents page, confirm table refreshes.

## Review Gate

Stop after this task and wait for user review before starting Task 03.
