# Master Project Reference

Read this file first in future sessions. It is the compact map of what exists now, what is only planned, and what mistakes to avoid.

## Read This First

- `client/` is the React frontend. It is currently a polished UI prototype with mock data and local state.
- `server/` is the NestJS backend. It is currently the default starter-style API with only `GET /`.
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
| `client/src/main.tsx` | Browser router setup with `/`, auth routes, `/app/*` routes, and `RouterProvider`. |
| `client/src/routes/__root.tsx` | Root layout with `ThemeProvider`, `Toaster`, and 404 page. |
| `client/src/routes/app.tsx` | Authenticated app shell using sidebar, header, and nested outlet. No real auth guard yet. |
| `client/src/routes/login.tsx` | Mock sign-in form; on submit shows toast and navigates to `/app/chat`. |
| `client/src/routes/register.tsx` | Mock account creation form; on submit shows toast and navigates to `/app/chat`. |
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
| `client/src/lib/mock/data.ts` | Mock documents, chats, messages, prompts, and usage chart data. |
| `client/src/lib/utils.ts` | `cn()` class-name merge helper. |
| `client/src/hooks/use-page-meta.ts` | Sets `document.title` for pages. |
| `client/src/hooks/use-mobile.tsx` | Mobile breakpoint helper. |
| `client/src/styles.css` | Tailwind v4 setup, CSS variables, theme tokens, auth background, markdown prose, and thinking-dot animation. |
| `client/vite.config.ts` | Vite plugins: React, Tailwind, tsconfig paths. |
| `client/components.json` | shadcn configuration and aliases. |

Client does not currently have real API services, TanStack Query usage, Zustand stores, typed env config, route-level lazy loading, or real auth/session handling.

## Server Current Map

Current stack: NestJS 11 and TypeScript. The backend is still a starter app.

Important files:

| Path | What it contains |
| --- | --- |
| `server/src/main.ts` | Creates `AppModule` and listens on `process.env.PORT ?? 3000`. |
| `server/src/app.module.ts` | Root module registering only `AppController` and `AppService`. |
| `server/src/app.controller.ts` | Root controller exposing only `GET /`. |
| `server/src/app.service.ts` | Returns `"Hello World!"`. |
| `server/src/app.controller.spec.ts` | Default unit test for `GET /`. |
| `server/test/app.e2e-spec.ts` | Default e2e test scaffold. |
| `server/.env.example` | Contains `DATABASE_URL` example, but database integration is not implemented yet. |
| `server/package.json` | Nest starter scripts and dependencies. Planned backend libraries are mostly not installed yet. |

Server does not currently have auth, users, documents, RAG ingestion, vector search, database modules, Drizzle ORM, Redis, BullMQ queues, Socket.io, Swagger, Zod validation, LangChain, typed config, global response format, or error filters.

## Current Gaps / Do Not Assume

- `TECH-STACK.md` and the architecture guides are the target direction, not proof that the feature exists.
- The client UI is mostly static or simulated. Uploads, chat responses, re-indexing, auth, profile changes, and settings saves do not call a backend.
- The server has no real domain modules yet. Build future backend features under the target `api/v1/<domain>` structure from `SERVER_STRUCTURE_GUIDE.md`.
- Do not connect client screens to API endpoints until the matching server contracts exist.
- Do not treat `server/.env.example` as evidence that database access is wired.

## Pitfalls & Lessons Learned

- Keep current implementation and planned architecture explicitly separated in docs and code reviews.
- Future env work should add typed config first. Avoid direct `process.env` or `import.meta.env` access in feature code.
- Client build currently succeeds but warns that the JS bundle is large; add route-level `React.lazy`/`Suspense` and chunking before the app grows much further.
- Several route files already hold substantial UI and local logic. Extract feature components/hooks/services as real behavior is added.
- Avoid backend shortcuts in services: planned server architecture expects controller -> service -> repository -> database, with Zod validation and standardized responses.
- Update this file after significant architecture decisions, new modules, API contracts, or development pitfalls so future sessions do not re-discover the same context.

## Quick Verification Snapshot

- Client build command used during mapping: `npm run build -- --mode development` from `client/`. It passed, with a large-chunk warning.
- Server unit test command used during mapping: `npm test -- --runInBand` from `server/`. It passed.
