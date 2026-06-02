# Task 01: Planning and Baseline

## Goal

Create the Corrective RAG planning files and capture the pre-change baseline.

## Scope

- Add `project_context/module_plans/corrective_rag/`.
- Add the module plan and ordered task files.
- Run targeted current Self-RAG tests before implementation.

## Implementation Details

- Use the accepted Corrective RAG plan as the source of truth.
- Record baseline test output in the module plan once complete.

## Completion Criteria

- Planning files exist.
- Baseline targeted server tests have passed or any blocker is documented.

## Test Cases

- `npm test -- self-rag-evaluator.service.spec.ts self-rag.service.spec.ts chat.service.spec.ts multi-query.service.spec.ts env.spec.ts --runInBand` from `server/`.

## Review Gate

Stop for review unless the user has explicitly requested continuing through implementation.
