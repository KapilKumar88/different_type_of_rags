# Task 01: Restore Server Build After Service Move

## Goal

Fix the backend build failure caused by stale imports after shared RAG services were moved from `src/api/v1/*` into `src/services/*`.

## Scope

- Update chat module/service/spec imports for `LlmService`, `LlmModule`, `QdrantService`, and `QdrantModule`.
- Update documents module/service/spec imports for `QdrantService` and `QdrantModule`.
- Update moved shared services so their config/type imports point to the correct `src/config` and `src/types` paths.
- Verify the backend compiles and targeted tests still pass.

## Implementation Details

- Keep shared infrastructure services under `server/src/services`.
- Do not move files back into `server/src/api/v1`.
- Do not change runtime behavior beyond restoring valid module resolution.

## Completion Criteria

- `npm run build` from `server/` passes.
- Targeted tests for chat, documents, and Qdrant pass.
- The module plan status is updated.

## Test Cases

- `npm run build`
- `npm test -- chat.service.spec.ts documents.service.spec.ts qdrant.service.spec.ts --runInBand`

## Review Gate

Stop after this task and report verification results before starting Task 02.

## Completion Notes

- Updated stale imports in chat and documents modules, services, and specs to use shared services from `src/services/*`.
- Updated moved `LlmService` and `QdrantService` relative imports so they resolve `src/config` and `src/types` correctly.
- Verification passed:
  - `npm run build`
  - `npm test -- chat.service.spec.ts documents.service.spec.ts qdrant.service.spec.ts --runInBand`
