# Project Development Rules

## General Principles

- **Always plan before coding.** Break the task into steps and review the plan before writing any code.
- **Ask, don't assume.** If anything is unclear, ask a clarifying question rather than guessing.
- **Read `MASTER_PROJECT_REFERENCE.MD` first.** Before starting any task, review it to understand the current project state, prior decisions, and known pitfalls.
- **Don't brute-force blockers.** If you hit a blocker, stop, analyze the root cause, and revise your approach before retrying.
- **Production-ready from day one.** Every piece of code must meet production standards:
  - Follow security best practices (input sanitization, auth guards, rate limiting, etc.)
  - Optimize for performance — avoid N+1 queries, unnecessary re-renders, and heavy bundles
  - Wrap all multi-query database operations in transactions
  - Handle errors gracefully — errors must never crash or break the UI
- **Small, testable increments.** Complete and test each chunk before moving to the next.
- **Never break existing functionality.** When modifying or building around existing features, always verify that nothing is broken afterward.
- **Test every task thoroughly** after completion before marking it done.
- **Enforce database-level constraints** (foreign keys, unique constraints, not-null) for data integrity — don't rely solely on application-level validation.
- **Keep `MASTER_PROJECT_REFERENCE.MD` up to date.** It is the single source of truth for the project. After any significant decision, pitfall encountered, or architecture change, update it so we don't repeat mistakes.

---

## Coding Standards

### General
- Use `camelCase` for all variable and function names.
- Never use the `any` type. Always define proper `interface`, `type`, or `enum` for everything.
- Always use optional chaining (`?.`) when accessing potentially nullable properties.
- Avoid nested ternary operators — use early returns, `if/else`, or helper variables instead.
- Never use chained/nested ternary rendering in JSX; extract the condition into an independent statement or focused helper component.
- Keep function cognitive complexity at or below 15; split complex components/functions into small focused helpers before crossing that limit.
- Prefer many small, focused files over one large file. Examples:
  - Each database table schema in its own file, with a master index file to aggregate them
  - Separate DTO/validation files per endpoint or feature, not one monolithic file per module
  - Small, single-purpose helper files instead of one large utility file

### Environment Variables
- Never access `process.env` or `import.meta.env` directly in application code.
- Always access environment variables through a typed config module/service (one per side: client and server).

### Error Handling & Logging
- Use a structured logger throughout the entire application (both client and server) for monitoring and debugging.
- All errors should be caught and handled — the application should degrade gracefully, never crash silently.

### API Standards
- Validate all incoming API request payloads using **Zod**.
- Document every API endpoint with **Swagger**, covering all possible responses: `200`, `201`, `400`, `401`, `403`, `404`, `422`, `500`.

### Frontend (React)
- Always use **code splitting** (`React.lazy` + `Suspense`) for route-level and heavy components.
- Manage server state with **TanStack Query** and client/UI state with **Zustand** — do not mix the two.
- Use the context apis of react where possible.

---

## Project Structure

This is a **monorepo** with two top-level folders:
- `client/` — Frontend (React + Vite + TypeScript)
- `server/` — Backend (NestJS + TypeScript)

Follow the architecture guidelines strictly:
- Frontend: `project-context/architecture/CLIENT_STRUCTURE_GUIDE.md`
- Backend: `project-context/architecture/SERVER_STRUCTURE_GUIDE.md`

---

## Tech Stack

Refer to `project-context/TECH-STACK.md` for the full list of libraries and versions used in this project.

---