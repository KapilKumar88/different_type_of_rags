# Task 03: Remove Or Scope Global Ask Retrieval

## Goal

Prevent `/api/v1/chat/ask` from searching every vector in Qdrant.

## Scope

- Either remove the legacy ask endpoint or require an owned conversation/document scope.
- Route retrieval through owner-validated document IDs.
- Update client/service contracts if the endpoint remains.

## Implementation Details

- Prefer reusing the conversation-scoped retrieval path.
- Avoid any endpoint that can retrieve chunks outside the authenticated user's authorized document set.

## Completion Criteria

- No public or authenticated endpoint can perform unscoped vector search across all documents.
- Tests cover scoped retrieval and rejected missing/invalid scope.

## Test Cases

- Ask without scope is rejected or unavailable.
- Ask with an owned scope searches only selected owned documents.
- Ask with another user's scope is rejected.

## Review Gate

Stop after this task and wait for user review before starting Task 04.

## Completion Notes

- Removed the legacy `POST /api/v1/chat/ask` endpoint instead of keeping a second scoped ask path.
- Deleted the unused ask DTO and removed `ChatService.ask`.
- Removed unscoped `QdrantService.search`; retrieval now goes through `searchByDocumentIds`.
- Removed unused client ask endpoint config, service method, and types.
- Verified no references remain to `chat/ask`, `AskQuestion*`, or unscoped `qdrantService.search`.
- Verification passed:
  - `npm run build` from `server/`
  - `npm test -- chat.service.spec.ts qdrant.service.spec.ts --runInBand` from `server/`
  - `npm run build` from `client/`
