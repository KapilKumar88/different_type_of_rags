# Task 07: Harden Prompt Context Boundaries

## Goal

Reduce prompt-injection and context-dilution risk from uploaded documents and long conversation history.

## Scope

- Mark retrieved document content as untrusted context in prompts.
- Keep the latest user message explicit.
- Trim or summarize conversation history by token budget.
- Add prompt-injection regression tests.

## Implementation Details

- Keep answers grounded in retrieved chunks only.
- Avoid inserting unbounded history directly into the final prompt.

## Completion Criteria

- Prompt format clearly separates instructions from untrusted context.
- History length is bounded.
- Tests cover malicious document instructions.

## Test Cases

- Document text that says to ignore instructions does not alter prompt policy.
- Long history is trimmed to budget.
- Latest user question remains present.

## Review Gate

Stop after this task and wait for user review before starting Task 08.

## Completion Notes

- Added explicit prompt rules that instruct the model to use only retrieved document excerpts and to treat retrieved context/history as untrusted content.
- Split the prompt into `<retrieved_context>`, `<conversation_history>`, and `<latest_user_message>` sections.
- Bounded retrieved context and prior conversation history to reduce context-dilution risk.
- Preserved the latest user message separately from truncated history.
- Added regression coverage for malicious document instructions and long-history truncation.

## Verification

- `npm test -- chat.service.spec.ts --runInBand` from `server/` passed with `1` suite and `25` tests.
- `npm run build` from `server/` passed.
