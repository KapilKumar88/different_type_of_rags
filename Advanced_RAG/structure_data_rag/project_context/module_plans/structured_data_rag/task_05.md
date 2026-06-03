# Task 05: Structured Retrieval and Query Execution

## Goal

Add safe structured query planning/execution and hybrid retrieval into chat answering.

## Scope

- Load scoped table schemas for selected conversation documents.
- Ask the LLM for a validated JSON query plan when structured tables are relevant.
- Execute only the internal query-plan DSL.
- Combine structured query results with existing vector retrieval.

## Implementation Details

- Supported operations: select, filter, sort, limit, count, sum, avg, min, max, and group-by.
- Reject unknown tables/columns/operators and invalid JSON plans.
- Fall back to vector retrieval when structured planning fails or no structured data is relevant.

## Completion Criteria

- SSE sources include structured query/table sources when used.
- Prompt includes `<structured_context>` separately from text retrieval.
- Existing scoped retrieval and prompt-injection safeguards remain in place.

## Test Cases

- Query planner/executor tests for supported operations, invalid plans, table-scope enforcement, and empty results.
- Chat service tests for structured-only, hybrid, fallback, and stable errors.

## Review Gate

Stop after structured retrieval review.
