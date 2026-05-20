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
| Task 01: Planning and Review Gates | [task_01.md](task_01.md) | Review | Planning | Documentation-only plan created from client analysis. |
| Task 02: Route-Level Code Splitting | [task_02.md](task_02.md) | Pending | Bundle size | Lazy-load route modules and add route Suspense fallback. |
| Task 03: Vite Chunk Strategy and Bundle Audit | [task_03.md](task_03.md) | Pending | Bundle size | Split stable vendor chunks and record before/after output. |
| Task 04: Chat Module Decomposition | [task_04.md](task_04.md) | Pending | Maintainability/code splitting | Extract chat components/hooks/utilities from the 1561-line route. |
| Task 05: Chat Streaming Render Performance | [task_05.md](task_05.md) | Pending | Runtime performance | Reduce per-token render pressure and fix hook dependency warnings. |
| Task 06: Document List and Upload Hardening | [task_06.md](task_06.md) | Pending | Performance/security | Memoize document derivations; validate file size/type client-side. |
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

- Task 01 is in Review.
- No runtime client code has been changed yet.
- Baseline verification captured:
  - `npm run build` passes with the existing large chunk warning.
  - `npm run lint` passes with `9` warnings.
  - `npm audit --audit-level=high` reports `0` high/critical and `6` moderate advisories.
