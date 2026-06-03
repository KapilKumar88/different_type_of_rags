# Task 06 — End-to-end verification, cleanup, docs

## Goal
Prove the full flow on a running stack, confirm delete cascade, and update reference docs.

## Scope
- Manual/integration verification
- `project_context/MASTER_PROJECT_REFERENCE.md`
- `project_context/module_plans/parent_child_rag_module/parent_child_rag_module_plan.md`

## Implementation Details / Verification
1. Infra up: Postgres, Qdrant (`:6333`), Ollama (`:11434`) with embedding + LLM models.
2. `npm run db:migrate`, `npm run build`, `npm test` (env, text-splitter, documents, qdrant, chat specs green).
3. `npm run start:dev`; authenticate; upload a doc. Confirm `SELECT count(*) FROM document_parents WHERE document_id='<id>'` > 0 and a Qdrant point payload includes `parentId`.
4. Ask a question. Confirm each source `text` is a ~2000-char parent (not a 400-char child) and `parentId` is set.
5. Delete the doc; confirm `document_parents` rows gone (cascade) and Qdrant has no points for that `documentId`.

## Completion Criteria
- Upload→ask→delete cycle works end-to-end with parent text confirmed in the LLM context and clean cascade on delete.
- Reference docs updated.

## Review Gate
Final review and module sign-off.
