# Task 03 — Parent/child splitting helper

## Goal
Replace the single-splitter helper with a two-level splitter that produces parents and, for each parent, its children — without yet wiring it into ingestion.

## Scope
- `server/src/api/v1/documents/helpers/text-splitter.ts`
- `server/src/api/v1/documents/helpers/text-splitter.spec.ts`

## Implementation Details
- Two `RecursiveCharacterTextSplitter`s built from `ragConfig.parentChunkSize/parentChunkOverlap` and `ragConfig.childChunkSize/childChunkOverlap`.
- Types: `ChildChunk = { text; pageNumber? }`; `ParentChunk = { parentIndex; text; pageNumber?; children: ChildChunk[] }`.
- `splitDocumentIntoParents(documentText: ParsedDocument): Promise<ParentChunk[]>` — per page: parent-split → trim/filter empties → assign global incrementing `parentIndex`; per parent: child-split → trim/filter → `ChildChunk[]` inheriting parent `pageNumber`; drop parents with zero children.
- Remove old `splitDocumentText`/`TextChunk` exports.

## Completion Criteria
- `npm run build` + helper tests pass.
- Multi-page doc yields ordered parents each with ≥1 child.

## Test Cases
- `parentIndex` contiguous + document-global across pages.
- Each child non-empty; child page number inherited from parent.

## Review Gate
Confirm splitting strategy (per-page parents, child page inheritance, global index).
