# Task 03: Vite Chunk Strategy and Bundle Audit

## Goal

Improve production cacheability and bundle diagnosis after route-level splitting is in place.

## Scope

- Update `client/vite.config.ts` only where useful.
- Add Rollup `manualChunks` for stable large vendors if build output shows they still dominate route chunks.
- Keep chunking conservative and understandable.

## Implementation Details

- Candidate vendor groups:
  - React/runtime: `react`, `react-dom`, `react-router-dom`.
  - Query/state: `@tanstack/react-query`, `zustand`.
  - Charts: `recharts`.
  - Markdown: `react-markdown`, `remark-gfm`.
  - Radix/shadcn-heavy primitives only if they remain bundled together in a way that hurts cacheability.
- Do not raise `chunkSizeWarningLimit` just to hide the warning.
- Record before/after chunk sizes in the plan notes.

## Completion Criteria

- Build output is split into predictable app/vendor chunks.
- No new large warning remains unless justified by a route-specific chunk.
- Chunk names make cache and debugging behavior easier to reason about.

## Test Cases

- Run `npm run build` from `client/`.
- Compare `dist/assets/*` sizes against Task 02 output.
- Run `npm run lint` from `client/`.

## Review Gate

Stop after this task and wait for user review before starting Task 04.
