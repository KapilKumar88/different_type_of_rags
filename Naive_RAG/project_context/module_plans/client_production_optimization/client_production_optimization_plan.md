# Client Production Optimization Plan

## Purpose

This file is the lookup and status tracker for production-readiness work in `client/`.

The analysis scope covers:

- Bundle size and code splitting.
- React render performance.
- Client-side API resilience and error handling.
- Security hardening for runtime config, uploads, dependency advisories, and browser-side behavior.
- Maintainability gaps that block safe production iteration.

Out of scope unless approved in a later task:

- Server API changes.
- Replacing the UI library or route framework.
- Implementing real backend behavior for currently mock Usage, Settings, Forgot Password, or Reset Password screens.
- Full observability vendor integration. This plan can add hooks/interfaces, but provider selection is a separate decision.

## Current Evidence

- `npm run build` from `client/` passes, but emits one JS chunk: `dist/assets/index-FOa8Gzki.js` at `1,240.45 kB` minified and `364.41 kB` gzip.
- `vite build` warns to use dynamic `import()` or `manualChunks` because a chunk is larger than `500 kB`.
- `src/main.tsx` statically imports every route page, including chat, documents, usage charts, settings, and auth screens.
- `src/routes/app.chat.tsx` is `1561` lines and contains page state, streaming orchestration, conversation sidebar, message renderer, source chunks, and dialogs in one module.
- `src/routes/app.documents.tsx` filters and reduces document lists directly on every render.
- `src/routes/app.usage.tsx` statically imports Recharts, making chart code part of the main bundle today.
- `npm run lint` passes with `0` errors and `9` warnings. Two warnings are hook dependency warnings in `app.chat.tsx`; the rest are Fast Refresh warnings in shared UI/provider files.
- `npm audit --audit-level=high` reports `0` high/critical advisories and `6` moderate advisories: `brace-expansion`, `postcss`, and `ws` through `@cloudflare/vite-plugin`/`wrangler`/`miniflare`.
- `src/components/app/upload-dialog.tsx` accepts extensions and displays "up to 50 MB each", but does not enforce client-side size/type checks before upload.
- `src/config/env.config.ts` falls back to `http://localhost:3000`, which is convenient locally but risky if a production build lacks `VITE_API_BASE_URL`.
- `src/lib/api-client.ts` has CSRF handling and credentialed fetches, but no request timeout, abort wiring, or central client-side logging hook.
- `src/services/chat.service.ts` interpolates dynamic IDs directly into SSE URLs through endpoint helpers; IDs should be URL-encoded at the config/helper boundary.

## React Documentation Notes

Checked against React docs on 2026-05-20:

- React `lazy` defers component code until first render and should be declared at module top level.
- Lazy-loaded components must be rendered under `Suspense` so a fallback can display while code loads.
- `Suspense` supports lazy-loaded component code; it does not automatically handle ordinary data fetches made inside Effects or event handlers.
- `useMemo` should be treated only as a performance optimization, after the underlying render behavior is correct and measured.
- `StrictMode` is already enabled in `main.tsx`; React docs confirm its extra checks are development-only and do not affect production builds.

Reference URLs:

- https://react.dev/reference/react/lazy
- https://react.dev/reference/react/Suspense
- https://react.dev/reference/react/useMemo
- https://react.dev/reference/react/StrictMode

## Status Legend

- `Pending`: Not started.
- `In Progress`: Implementation has started but is not ready for review.
- `Review`: Task is complete and waiting for user review.
- `Approved`: User reviewed and approved the task.

## Task Status

| Task | File | Status | Focus | Notes |
| --- | --- | --- | --- | --- |
| Task 01: Planning and Review Gates | [task_01.md](task_01.md) | Approved | Planning | User approved the plan and requested Task 02 implementation. |
| Task 02: Route-Level Code Splitting | [task_02.md](task_02.md) | Approved | Bundle size | User approved the lazy route split and requested Task 03 implementation. |
| Task 03: Vite Chunk Strategy and Bundle Audit | [task_03.md](task_03.md) | Approved | Bundle size | User approved moving forward after discussing the manual chunking tradeoff. |
| Task 04: Chat Module Decomposition | [task_04.md](task_04.md) | Approved | Maintainability/code splitting | User approved the chat extraction and requested Task 05 implementation. |
| Task 05: Chat Streaming Render Performance | [task_05.md](task_05.md) | Approved | Runtime performance | User approved the streaming render changes and requested Task 06 implementation. |
| Task 06: Document List and Upload Hardening | [task_06.md](task_06.md) | Review | Performance/security | Memoized document derivations and added client-side upload type/size validation. |
| Task 07: Runtime Config and API Resilience | [task_07.md](task_07.md) | Pending | Security/resilience | Validate production env, encode IDs, add timeout/abort handling. |
| Task 08: Dependency and Static Hosting Security | [task_08.md](task_08.md) | Pending | Security | Address moderate advisories where safe and add static asset security headers. |
| Task 09: Error Boundaries and Client Logging | [task_09.md](task_09.md) | Pending | Reliability | Replace generic route error behavior and add structured client logger hooks. |
| Task 10: Final Verification and Reference Update | [task_10.md](task_10.md) | Pending | Verification/docs | Run final checks and update `MASTER_PROJECT_REFERENCE.md`. |

## Key Technical Decisions

- Start with route-level code splitting because it directly addresses the current Vite warning and is required by `AGENTS.md`.
- Keep route behavior unchanged while converting modules to lazy imports.
- Preserve TanStack Query for server state and Zustand for auth/client state.
- Prefer focused extraction over broad rewrites. Split `app.chat.tsx` only along existing responsibilities: page orchestration, streaming hook, conversation list, message renderer, dialogs, and helpers.
- Do not use `useMemo` as a blanket fix. Apply it to measured or lint-identified derived values, especially stable fallback arrays and document filtering/reductions.
- Keep the typed config pattern. Extend it instead of reading `import.meta.env` in feature code.
- Treat upload validation as defense in depth. Client checks improve UX, but server validation remains authoritative.
- Keep generated shadcn/Radix UI primitives mostly unchanged unless a warning creates real production risk.

## Strict Workflow

- Always read this lookup file before starting or resuming this module.
- Always read the current task file before implementing that task.
- Complete tasks in numeric order.
- Do not implement future tasks early.
- After completing each task, update this lookup file with status and notes.
- Stop after each task and ask the user for review.
- Continue to the next task only after explicit approval.
- Run task-specific verification before marking a task ready for review.
- Do not touch unrelated user changes.
- After the full module is completed and approved, update `project_context/MASTER_PROJECT_REFERENCE.md` with new current-state facts, verification commands, bundle results, and production pitfalls.

## Completion Summary

- Task 01 is approved.
- Task 02 is approved.
- Task 03 is approved.
- Task 04 is approved.
- Task 05 is approved.
- Task 06 is in Review.
- Baseline verification captured:
  - `npm run build` passes with the existing large chunk warning.
  - `npm run lint` passes with `9` warnings.
  - `npm audit --audit-level=high` reports `0` high/critical and `6` moderate advisories.
- Task 02 verification:
  - `npm run lint` from `client/` passed with the same `9` existing warnings.
  - `npm run build` from `client/` passed.
  - Build now emits multiple lazy JS chunks instead of one application JS bundle.
  - Largest entry-like `index` JS chunk is `363.08 kB` minified / `114.44 kB` gzip, down from the baseline single `1,240.45 kB` minified / `364.41 kB` gzip JS bundle.
  - Largest lazy route chunk is `app.usage` at `400.23 kB` minified / `110.50 kB` gzip, which should be reviewed in Task 03.
- Task 03 verification:
  - `npm run lint` from `client/` passed with the same `9` existing warnings.
  - `npm run build` from `client/` passed with no large-chunk warning.
  - Vite now creates named vendor chunks: `vendor-react`, `vendor-query-state`, `vendor-markdown`, and `vendor-charts`.
  - Generated `index.html` preloads only `vendor-react` and `vendor-query-state` with the app entry; `vendor-markdown` and `vendor-charts` remain lazy route dependencies.
  - Entry app chunk after manual chunks: `45.18 kB` minified / `13.87 kB` gzip.
  - Eager vendor chunks: `vendor-react` at `283.58 kB` minified / `90.93 kB` gzip and `vendor-query-state` at `36.25 kB` minified / `10.77 kB` gzip.
  - Lazy heavy vendors: `vendor-charts` at `392.93 kB` minified / `108.04 kB` gzip and `vendor-markdown` at `156.79 kB` minified / `47.47 kB` gzip.
  - `app.usage` route code dropped from `400.23 kB` minified / `110.50 kB` gzip to `7.77 kB` minified / `2.61 kB` gzip because Recharts/D3 moved into `vendor-charts`.
  - `app.chat` route code dropped from `194.05 kB` minified / `58.62 kB` gzip to `37.21 kB` minified / `11.08 kB` gzip because Markdown dependencies moved into `vendor-markdown`.
- Task 04 verification:
  - `app.chat.tsx` dropped from `1561` lines to `667` lines.
  - Added focused chat files:
    - `src/types/chat-ui.types.ts`
    - `src/components/chat/chat.constants.ts`
    - `src/components/chat/chat.helpers.ts`
    - `src/components/chat/conversation-header.tsx`
    - `src/components/chat/conversation-list.tsx`
    - `src/components/chat/conversation-dialogs.tsx`
    - `src/components/chat/message-display.tsx`
  - Route behavior remains owned by `app.chat.tsx`: queries, mutations, active conversation state, stream lifecycle, and send/retry/stop logic.
  - Presentational UI and formatting helpers moved out of the route.
  - `npm run lint` from `client/` passed with the same `9` existing warnings.
  - `npm run build` from `client/` passed.
  - Manual browser verification was not run in this environment because the full backend/runtime stack is not active here.
- Task 05 verification:
  - Chat-specific hook dependency warnings are resolved.
  - `conversations` and `documents` now use stable fallback arrays instead of new `[]` instances per render.
  - Selected conversation documents are memoized from the active document IDs and document map.
  - SSE token events now buffer into `requestAnimationFrame`, reducing render pressure from one render per token event to at most one token flush per animation frame.
  - Stream cleanup cancels pending animation frames on stop, conversation switch, stream error, stream completion, and unmount.
  - `npm run lint` from `client/` passed with `7` remaining Fast Refresh warnings only. The previous `app.chat.tsx` hook dependency warnings are gone.
  - `npm run build` from `client/` passed.
  - Manual streaming verification was not run in this environment because the full backend/runtime stack is not active here.
- Task 06 verification:
  - Documents page now uses a stable empty documents fallback.
  - Search query normalization, filtered document list, and total chunk count are memoized.
  - Upload dialog validates file extension before upload. Allowed extensions: `.pdf`, `.docx`, `.txt`, `.csv`, `.md`.
  - Upload dialog validates file size before upload. Max size remains aligned with UI copy at `50 MB`.
  - Invalid files are displayed as failed upload rows and are not sent to the API.
  - File input is reset after selection so the same file can be reselected after validation or upload.
  - Existing valid-file upload behavior remains unchanged; uploads still start immediately for valid selected files.
  - `npm run lint` from `client/` passed with `7` existing Fast Refresh warnings only.
  - `npm run build` from `client/` passed.
  - Manual file upload checks were not run because the full backend/runtime stack is not active here.
