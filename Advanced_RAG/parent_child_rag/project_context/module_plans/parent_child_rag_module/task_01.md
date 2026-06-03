# Task 01 — Config, env, and module-plan scaffolding

## Goal
Introduce all parent/child tuning knobs through the typed config layer (no `process.env` access in app code) and lay down the module-plan tracking files. Additive config only — no behavior change.

## Scope
- `server/src/config/env.ts`
- `server/src/config/rag.config.ts`
- `server/.env.example`
- `server/src/config/env.spec.ts`
- `project_context/module_plans/parent_child_rag_module/*`

## Implementation Details
- `env.ts`: add `RAG_PARENT_CHUNK_SIZE` (2000), `RAG_PARENT_CHUNK_OVERLAP` (200), `RAG_CHILD_CHUNK_SIZE` (400), `RAG_CHILD_CHUNK_OVERLAP` (50), `RAG_CHILD_TOP_K` (12), `RAG_PARENT_TOP_K` (4). Sizes/topK use `positive`; overlaps use `nonnegative` (0 allowed).
- `rag.config.ts`: add `parentChunkSize/parentChunkOverlap/childChunkSize/childChunkOverlap/childTopK/parentTopK`. The legacy `chunkSize:800 / chunkOverlap:100` are KEPT for now (the naive splitter still uses them) and are removed in Task 03 alongside the splitter rewrite — this keeps the build green at every review gate.
- `.env.example`: document the six new vars with defaults.
- `env.spec.ts`: assert the new vars resolve to their defaults.

## Completion Criteria
- `npm run build` passes.
- `npm test -- env.spec` passes.
- No behavior change in ingestion/retrieval.

## Test Cases
- Env parse with only `DATABASE_URL` set yields all six parent/child defaults.

## Review Gate
Confirm config naming + default values before touching schema/ingest.
