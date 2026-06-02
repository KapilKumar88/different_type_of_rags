# Task 01: Planning and Config

## Goal

Create the required module planning files and add typed configuration defaults for Hybrid RAG.

## Scope

- Create `project_context/module_plans/hybrid_rag_module/`.
- Add module status tracker and task files.
- Extend typed server env/config for sparse vector and fusion settings.
- Update `.env.example`.

## Implementation Details

- Add `QDRANT_SPARSE_VECTOR_NAME`.
- Add hybrid retrieval candidate limit, RRF K, dense/sparse weights, and sparse feature cap.
- Access all new values through typed config modules only.

## Completion Criteria

- Planning files exist.
- Server config parses defaults and explicit values.
- No direct `process.env` access is added in application code.

## Test Cases

- Existing env config tests still pass.
- Server build validates config typing.

## Review Gate

Stop for review after this task unless the user explicitly requested full implementation in one run.
