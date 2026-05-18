# Master Project Reference

Read this file first in future sessions. It is the compact map of what exists now, what is only planned, and what mistakes to avoid.

## Read This First

- `client/` is the React frontend. It is a polished UI with real auth flows and protected app routes; non-auth product features still use mock/local data.
- `server/` is the NestJS backend. It now has a real auth module plus the starter `GET /` route; non-auth domain APIs are not implemented yet.
- Ignore generated/vendor output while reasoning about the app: `client/node_modules/`, `server/node_modules/`, `client/dist/`, `server/dist/`.
- Detailed target guides live in:
  - `project_context/TECH-STACK.md`
  - `project_context/architecture/CLIENT_STRUCTURE_GUIDE.md`
  - `project_context/architecture/SERVER_STRUCTURE_GUIDE.md`
- Those guides describe the intended architecture. This file describes the current codebase state.

## Client Current Map

Current stack: Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/Radix UI primitives, lucide icons, Recharts, Sonner, React Router.

Important files and folders:

| Path | What it contains |
| --- | --- |
| `client/src/main.tsx` | Browser router setup with `/`, guarded auth routes, guarded `/app/*` routes, `RouterProvider`, and TanStack Query provider. |
| `client/src/routes/__root.tsx` | Root layout with `ThemeProvider`, `Toaster`, and 404 page. |
| `client/src/routes/app.tsx` | Authenticated app shell using sidebar, header, and nested outlet. Route access is protected by `client/src/guard/auth-guard.tsx`. |
| `client/src/routes/login.tsx` | Real sign-in form using Zod validation, `authService.login`, HttpOnly cookie session, Zustand auth state, and navigation to `/app/chat`. |
| `client/src/routes/register.tsx` | Real account creation form using Zod validation, `authService.register`, HttpOnly cookie session, Zustand auth state, and navigation to `/app/chat`. |
| `client/src/routes/forgot-password.tsx` | Mock password reset request form. |
| `client/src/routes/reset-password.tsx` | Mock new-password form; on submit navigates to `/login`. |
| `client/src/routes/app.chat.tsx` | Chat UI with mock conversations, local messages, simulated assistant response, markdown rendering, and source badges. |
| `client/src/routes/app.documents.tsx` | Documents table with local filtering, mock delete/re-index actions, and upload dialog entrypoint. |
| `client/src/routes/app.usage.tsx` | Usage dashboard with Recharts charts and mock token/chat/document stats. |
| `client/src/routes/app.settings.tsx` | Profile, security, model, and appearance settings UI; all actions are local/mock. |
| `client/src/components/app/*` | App header, sidebar, theme toggle, and simulated upload dialog. |
| `client/src/components/auth/auth-layout.tsx` | Shared auth page layout. |
| `client/src/components/chat/markdown.tsx` | `react-markdown` + `remark-gfm` wrapper for assistant messages. |
| `client/src/components/theme-provider.tsx` | Light/dark/system theme context persisted in `localStorage` key `rag-theme`. |
| `client/src/components/ui/*` | shadcn/Radix UI primitives. Treat as generated-style UI building blocks. |
| `client/src/config/*` | Typed client env/API config, including `VITE_API_BASE_URL` fallback to `http://localhost:3000`. |
| `client/src/guard/*` | Client auth guards: `AuthGuard` protects `/app/*`, `GuestGuard` redirects authenticated users away from `/login` and `/register`, and `AuthLoading` handles session-check loading UI. |
| `client/src/lib/api-client.ts` | Shared fetch wrapper with `credentials: "include"` and standardized API error handling. |
| `client/src/lib/mock/data.ts` | Mock documents, chats, messages, prompts, and usage chart data. |
| `client/src/lib/query-client.ts` | Shared TanStack Query client. |
| `client/src/lib/utils.ts` | `cn()` class-name merge helper. |
| `client/src/services/auth.service.ts` | Auth API service for `register`, `login`, and `me`. |
| `client/src/store/auth.store.ts` | Zustand auth store with `unknown`, `authenticated`, and `unauthenticated` states. |
| `client/src/types/auth.types.ts` | Shared auth payload, response, user, and status types. |
| `client/src/validations/auth.validation.ts` | Zod schemas for login and registration forms. |
| `client/src/hooks/use-page-meta.ts` | Sets `document.title` for pages. |
| `client/src/hooks/use-mobile.tsx` | Mobile breakpoint helper. |
| `client/src/styles.css` | Tailwind v4 setup, CSS variables, theme tokens, auth background, markdown prose, and thinking-dot animation. |
| `client/vite.config.ts` | Vite plugins: React, Tailwind, tsconfig paths. |
| `client/components.json` | shadcn configuration and aliases. |

Client now has real auth/session handling, auth API services, TanStack Query provider, Zustand auth store, typed env/API config, and guarded auth/app routes. Route-level lazy loading is still not implemented, and non-auth product features still use mock/local data.

## Server Current Map

Current stack: NestJS 11, TypeScript, Drizzle ORM, Postgres driver, Zod, JWT, cookie-parser, and bcryptjs. The backend has a real auth module and database foundation; non-auth domain modules are still not implemented.

Important files:

| Path | What it contains |
| --- | --- |
| `server/src/main.ts` | Creates `AppModule`, registers cookie parsing and HTTP exception filtering, and listens on typed app config port. |
| `server/src/app.module.ts` | Root module registering app services, database module, auth module, and global JWT auth guard. |
| `server/src/app.controller.ts` | Root controller exposing public `GET /`. |
| `server/src/app.service.ts` | Returns `"Hello World!"`. |
| `server/src/api/v1/auth/*` | Auth module with register, login, and current-user endpoints, plus controller/service/repository layering and tests. |
| `server/src/common/filters/http-exception.filter.ts` | Standardizes Nest HTTP errors into `{ success, message, data }`. |
| `server/src/common/pipes/zod-validation.pipe.ts` | Reusable Zod request validation pipe returning `422` validation errors. |
| `server/src/config/*` | Typed config modules for app, database, JWT, cookies, and environment parsing. |
| `server/src/database/schemas/users.schema.ts` | Drizzle users table schema with unique email constraint and password hash. |
| `server/src/database/migrations/*` | Initial Drizzle migration for the users table. |
| `server/src/guard/*` | Global JWT auth guard, `@Public()`, `@CurrentUser()`, and authenticated request typing. |
| `server/src/services/database/*` | Global Drizzle database module/service backed by Postgres. |
| `server/src/app.controller.spec.ts` | Default unit test for `GET /`. |
| `server/test/app.e2e-spec.ts` | Default e2e test scaffold. |
| `server/.env.example` | Documents app, database, JWT, and auth cookie configuration. |
| `server/drizzle.config.ts` | Drizzle Kit config for schemas and migrations. |
| `server/package.json` | Nest scripts plus Drizzle migration scripts and auth/database dependencies. |

Server now has auth, users table schema, Drizzle database foundation, Zod validation, typed config, standardized HTTP error responses, and cookie/JWT auth guards. Server still does not have documents, RAG ingestion, vector search, Redis, BullMQ queues, Socket.io, Swagger decorators, LangChain, or non-auth domain modules.

## Auth Module Current State

Implemented scope:

- `POST /api/v1/auth/register` validates name/email/password/confirmPassword, rejects duplicate email with `409`, hashes passwords, creates users, sets the HttpOnly auth cookie, and returns safe user fields.
- `POST /api/v1/auth/login` validates email/password, rejects invalid credentials with `401`, sets the HttpOnly auth cookie, and returns safe user fields.
- `GET /api/v1/auth/me` is protected by the global JWT guard and returns the guard-provided authenticated user.
- Client login/register forms call the backend through `authService`, validate with Zod, store the returned user in Zustand, and navigate to `/app/chat` on success.
- Client `/app/*` routes verify session state through `/api/v1/auth/me`; unauthenticated users redirect to `/login`.
- Client `/login` and `/register` redirect authenticated users to `/app/chat`.

Auth API response contracts:

- Success responses use `{ success: true, message, data: { user } }`.
- Error responses use `{ success: false, message, data }`.
- Safe user shape is `{ id, name, email }`; `passwordHash` is never returned.
- Auth session is an HttpOnly cookie named by `AUTH_COOKIE_NAME` (`rag_auth_token` by default).

## Current Gaps / Do Not Assume

- `TECH-STACK.md` and the architecture guides are the target direction, not proof that the feature exists.
- Uploads, chat responses, re-indexing, profile changes, usage, documents, and settings saves still use local/mock behavior and do not call backend APIs.
- The server has only the auth domain module. Build future backend features under the target `api/v1/<domain>` structure from `SERVER_STRUCTURE_GUIDE.md`.
- Do not connect non-auth client screens to API endpoints until the matching server contracts exist.
- `server/.env.example` now documents real auth/database config, but local runtime still requires a reachable Postgres database and migrations before real registration/login can persist users.

## Pitfalls & Lessons Learned

- Keep current implementation and planned architecture explicitly separated in docs and code reviews.
- Future env work should extend typed config first. Avoid direct `process.env` or `import.meta.env` access in feature code.
- Client build currently succeeds but warns that the JS bundle is large; add route-level `React.lazy`/`Suspense` and chunking before the app grows much further.
- Several route files already hold substantial UI and local logic. Extract feature components/hooks/services as real behavior is added.
- Avoid backend shortcuts in services: planned server architecture expects controller -> service -> repository -> database, with Zod validation and standardized responses.
- Auth e2e tests use Supertest and may need local-bind permission in sandboxed environments.
- Client lint currently passes with existing Fast Refresh warnings in generated/shared UI/provider files.
- Update this file after significant architecture decisions, new modules, API contracts, or development pitfalls so future sessions do not re-discover the same context.

## Quick Verification Snapshot

- Client verification after auth module: `npm run build` from `client/` passed, with a large-chunk warning.
- Client lint after auth module: `npm run lint` from `client/` passed with existing Fast Refresh warnings only.
- Server verification after auth module: `npm run build` and `npm test -- --runInBand` from `server/` passed.
- Server e2e verification after auth module: `npm run test:e2e -- --runInBand` from `server/` passed when local server binding was permitted.
