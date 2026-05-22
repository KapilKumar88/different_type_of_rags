# Task 06: Add RAG Abuse Controls

## Goal

Limit expensive RAG operations per user/IP and prevent runaway concurrency.

## Scope

- Add throttling to upload, message creation, SSE streaming, and ask/scope endpoints.
- Add concurrency limits around embedding, parsing, vector search, and LLM streaming.
- Add global request/body limits where appropriate.

## Implementation Details

- Use Nest throttler patterns already used by auth where possible.
- Return stable `429` responses.

## Completion Criteria

- Expensive endpoints have explicit abuse controls.
- Tests cover rate-limited requests.

## Test Cases

- Excess upload requests return `429`.
- Excess stream starts return `429`.
- Normal authenticated usage still works.

## Review Gate

Stop after this task and wait for user review before starting Task 07.
