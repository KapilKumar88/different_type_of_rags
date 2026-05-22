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
