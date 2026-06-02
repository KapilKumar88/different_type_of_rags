# Task 05: Chat Streaming Render Performance

## Goal

Reduce unnecessary chat re-renders, especially during SSE token streaming.

## Scope

- Fix current hook dependency warnings in `app.chat.tsx`.
- Stabilize derived arrays and callbacks where they affect effects or memoized children.
- Batch or throttle streaming token updates if needed.

## Implementation Details

- Current lint warnings point to `conversations` and `documents` fallback arrays changing on every render.
- Current streaming path calls `setMessages` for every token event, which can create heavy render pressure for long answers.
- Consider a small token buffer with `requestAnimationFrame` or a timed flush so the UI remains responsive without losing streaming feel.
- Use `useMemo`, `useCallback`, or `React.memo` only where there is a concrete render reason.
- Preserve stop/retry behavior and cleanup on unmount.

## Completion Criteria

- Hook dependency warnings in chat are resolved.
- Streaming still displays progressively.
- Stop, retry, and conversation switching still close streams correctly.
- UI remains responsive during long streamed responses.

## Test Cases

- Run `npm run lint` from `client/`.
- Run `npm run build` from `client/`.
- Manual streaming test with long answer, Stop, Retry, and route change cleanup when backend is available.

## Review Gate

Stop after this task and wait for user review before starting Task 06.
