# Task 08: Verification and Context Update

## Goal

Verify the full RAG implementation and update project context documentation.

## Scope

- Run server verification.
- Run client verification.
- Record manual acceptance steps.
- Update `MASTER_PROJECT_REFERENCE.md`.
- Add a concise test report in the RAG module plan folder.

## Implementation Details

- Run backend checks from `Naive_RAG/server`:
  - `npm run build`
  - targeted tests or `npm test -- --runInBand` when practical
- Run frontend checks from `Naive_RAG/client`:
  - `npm run build`
- If local Qdrant/Ollama/Postgres are available, manually verify:
  - Upload a small text document.
  - Ask an answerable question.
  - Ask an unanswerable question and confirm the fallback sentence.
  - Delete the uploaded document.
- Update `project_context/MASTER_PROJECT_REFERENCE.md` with:
  - New backend modules.
  - API contracts.
  - New client services/pages behavior.
  - Required runtime services and env vars.
  - Verification results and known limitations.
- Add `test_report.md` under `rag_module`.

## Completion Criteria

- Server and client builds pass, or failures are documented with exact blockers.
- Project reference reflects the current implementation.
- RAG module status tracker marks completed tasks accurately.
- Test report records commands, outcomes, and manual steps.

## Test Cases

- Confirm all commands listed above were run or explicitly documented as blocked.
- Inspect `MASTER_PROJECT_REFERENCE.md` for new RAG current-state facts.
- Inspect `rag_module_plan.md` for final task statuses and completion summary.

## Review Gate

After completing this task, ask the user to review the final implementation and verification notes.
