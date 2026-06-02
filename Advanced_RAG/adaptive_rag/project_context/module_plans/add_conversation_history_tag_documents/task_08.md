# Task 08: Verification and Context Update

## Goal

Verify the full feature end to end, document the results, and update module status.

## Scope

- Run server and client builds.
- Run relevant server tests.
- Perform manual browser checks for conversation history, document scoping, and streaming.
- Update `test_report.md`.
- Update `conversation_history_tag_documents_plan.md` task statuses and completion summary.

## Implementation Details

- Server verification:
  - `npm run build`
  - `npm test -- --runInBand` or targeted tests when full test runtime is excessive.
- Client verification:
  - `npm run build`
- Manual verification:
  - Upload at least two documents.
  - Create one conversation for document A only.
  - Create one conversation for document B only.
  - Ask similar questions and confirm sources do not overlap.
  - Create one conversation with both documents selected.
  - Confirm retrieval can use only those selected documents.
  - Confirm streamed tokens appear before the final assistant message is saved.
  - Refresh the page and confirm conversation history persists.
- Record failures, skipped checks, and environmental blockers in `test_report.md`.

## Completion Criteria

- Server build result is recorded.
- Client build result is recorded.
- Relevant automated test results are recorded.
- Manual document-scoping checks are recorded.
- Manual streaming checks are recorded.
- Any known limitations or follow-up work are documented.
- Lookup file marks Task 08 as `Review`.

## Test Cases

- Confirm all task statuses in the lookup file are accurate.
- Confirm `test_report.md` includes date, environment, commands, results, and manual scenarios.
- Confirm no unplanned code paths were changed.

## Review Gate

Stop after this task and wait for user review.
