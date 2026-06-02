# Task 06: Client Document Integration

## Goal

Replace mock document upload/list/delete behavior with real API-backed behavior.

## Scope

- Extend the shared API client for `FormData` and `DELETE`.
- Add document types.
- Add document service.
- Update upload dialog.
- Update documents page.

## Implementation Details

- Work inside `Naive_RAG/client`.
- Add `src/types/document.types.ts`.
- Add `src/services/documents.service.ts`.
- Extend `api.config.ts` with document endpoints.
- Extend `api-client.ts` so `FormData` requests do not force JSON `Content-Type`.
- Add a `delete` helper to the API client.
- Update `UploadDialog` to:
  - Upload one file at a time through the service.
  - Show per-file upload/indexing status.
  - Call a success callback after uploads finish.
  - Surface backend errors with toast messages.
- Update `DocumentsPage` to:
  - Load documents with TanStack Query.
  - Keep simple search/filter UI.
  - Delete through API mutation.
  - Refresh after upload/delete.

## Completion Criteria

- Documents page no longer uses `mockDocuments`.
- Upload dialog sends real multipart requests.
- Delete action calls the backend.
- Loading, empty, and error states are handled gracefully.

## Test Cases

- Run `npm run build` from `Naive_RAG/client`.
- Confirm TypeScript catches no API type errors.
- Manually upload and delete a document when backend dependencies are running.

## Review Gate

After completing this task, update `rag_module_plan.md`, then continue or stop according to the user's requested workflow.
