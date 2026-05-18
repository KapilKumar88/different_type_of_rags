# Master Project Reference

Read this file first in future sessions. It is the compact map of what exists now, what is only planned, and what mistakes to avoid.

## Read This First

- `client/` is the React frontend. It has real auth flows, protected app routes, API-backed document upload/list/delete, and API-backed RAG chat. Usage/settings/password-reset screens still use mock/local behavior.
- `server/` is the NestJS backend. It has real auth plus a learning-focused Naive RAG backend with document ingestion, Qdrant vector storage/search, Ollama embeddings/LLM calls, and chat answering.
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
| `client/src/routes/app.chat.tsx` | API-backed Naive RAG chat UI. Sends questions to `/api/v1/chat/ask`, renders markdown answers, and displays retrieved source chunks with file/page/score/text. |
| `client/src/routes/app.documents.tsx` | API-backed documents table. Loads `/api/v1/documents`, filters locally, deletes with `DELETE /api/v1/documents/:id`, and refreshes after upload/delete. |
| `client/src/routes/app.usage.tsx` | Usage dashboard with Recharts charts and mock token/chat/document stats. |
| `client/src/routes/app.settings.tsx` | Profile, security, model, and appearance settings UI; all actions are local/mock. |
| `client/src/components/app/*` | App header, sidebar, theme toggle, and real multipart upload dialog for `/api/v1/documents/upload`. |
| `client/src/components/auth/auth-layout.tsx` | Shared auth page layout. |
| `client/src/components/chat/markdown.tsx` | `react-markdown` + `remark-gfm` wrapper for assistant messages. |
| `client/src/components/theme-provider.tsx` | Light/dark/system theme context persisted in `localStorage` key `rag-theme`. |
| `client/src/components/ui/*` | shadcn/Radix UI primitives. Treat as generated-style UI building blocks. |
| `client/src/config/*` | Typed client env/API config, including `VITE_API_BASE_URL` fallback to `http://localhost:3000`. |
| `client/src/guard/*` | Client auth guards: `AuthGuard` protects `/app/*`, `GuestGuard` redirects authenticated users away from `/login` and `/register`, and `AuthLoading` handles session-check loading UI. |
| `client/src/lib/api-client.ts` | Shared fetch wrapper with `credentials: "include"`, standardized API error handling, JSON/FormData body support, and `GET`/`POST`/`DELETE` helpers. |
| `client/src/lib/mock/data.ts` | Mock documents, chats, messages, prompts, and usage chart data. |
| `client/src/lib/query-client.ts` | Shared TanStack Query client. |
| `client/src/lib/utils.ts` | `cn()` class-name merge helper. |
| `client/src/services/auth.service.ts` | Auth API service for `register`, `login`, and `me`. |
| `client/src/services/documents.service.ts` | Documents API service for list, multipart upload, and delete. |
| `client/src/services/chat.service.ts` | Chat API service for asking Naive RAG questions. |
| `client/src/store/auth.store.ts` | Zustand auth store with `unknown`, `authenticated`, and `unauthenticated` states. |
| `client/src/types/auth.types.ts` | Shared auth payload, response, user, and status types. |
| `client/src/types/document.types.ts` | Document metadata response types used by the documents page and upload dialog. |
| `client/src/types/chat.types.ts` | Chat answer and retrieved source chunk response types. |
| `client/src/validations/auth.validation.ts` | Zod schemas for login and registration forms. |
| `client/src/hooks/use-page-meta.ts` | Sets `document.title` for pages. |
| `client/src/hooks/use-mobile.tsx` | Mobile breakpoint helper. |
| `client/src/styles.css` | Tailwind v4 setup, CSS variables, theme tokens, auth background, markdown prose, and thinking-dot animation. |
| `client/vite.config.ts` | Vite plugins: React, Tailwind, tsconfig paths. |
| `client/components.json` | shadcn configuration and aliases. |

Client now has real auth/session handling, typed API services, TanStack Query provider, Zustand auth store, guarded auth/app routes, API-backed document management, and API-backed RAG chat. Route-level lazy loading is still not implemented. Usage, settings saves, and password reset remain mock/local.

## Server Current Map

Current stack: NestJS 11, TypeScript, Drizzle ORM, Postgres driver, Zod, JWT, cookie-parser, bcryptjs, Qdrant JS client, LangChain Ollama integration, LangChain text splitters, pdf-parse, mammoth, and Multer. The backend has real auth and Naive RAG domain modules.

Important files:

| Path | What it contains |
| --- | --- |
| `server/src/main.ts` | Creates `AppModule`, registers cookie parsing and HTTP exception filtering, and listens on typed app config port. |
| `server/src/app.module.ts` | Root module registering app services, database module, auth module, documents module, chat module, and global JWT auth guard. |
| `server/src/app.controller.ts` | Root controller exposing public `GET /`. |
| `server/src/app.service.ts` | Returns `"Hello World!"`. |
| `server/src/api/v1/auth/*` | Auth module with register, login, and current-user endpoints, plus controller/service/repository layering and tests. |
| `server/src/api/v1/documents/*` | Documents module with upload/list/delete endpoints, text extraction helpers, recursive chunking, embedding generation, Qdrant upsert/delete, Postgres metadata repository, and focused tests. |
| `server/src/api/v1/chat/*` | Chat module with `/api/v1/chat/ask`, question embedding, Qdrant top-5 retrieval, fixed context-only prompt construction, LLM call, source chunk response, and focused tests. |
| `server/src/api/v1/qdrant/*` | Shared Qdrant module that ensures collection creation, upserts vector points, searches by vector, and deletes points by `documentId`. |
| `server/src/api/v1/embeddings/*` | Shared Ollama embeddings module using `nomic-embed-text:v1.5` and validating vector size against config. |
| `server/src/api/v1/llm/*` | Shared Ollama chat module using configured local/cloud Ollama model for final answer generation. |
| `server/src/common/filters/http-exception.filter.ts` | Standardizes Nest HTTP errors into `{ success, message, data }`. |
| `server/src/common/pipes/zod-validation.pipe.ts` | Reusable Zod request validation pipe returning `422` validation errors. |
| `server/src/config/*` | Typed config modules for app, database, JWT, cookies, Qdrant, Ollama, RAG settings, and environment parsing. |
| `server/src/database/schemas/users.schema.ts` | Drizzle users table schema with unique email constraint and password hash. |
| `server/src/database/schemas/documents.schema.ts` | Drizzle documents metadata table schema. Chunk text and vectors are stored in Qdrant payloads, not Postgres. |
| `server/src/database/migrations/*` | Drizzle migrations for users and documents metadata tables. |
| `server/src/guard/*` | Global JWT auth guard, `@Public()`, `@CurrentUser()`, and authenticated request typing. |
| `server/src/services/database/*` | Global Drizzle database module/service backed by Postgres. |
| `server/src/app.controller.spec.ts` | Default unit test for `GET /`. |
| `server/test/app.e2e-spec.ts` | Default e2e test scaffold. |
| `server/.env.example` | Documents app, database, JWT, auth cookie, Qdrant, Ollama, and RAG configuration. |
| `server/drizzle.config.ts` | Drizzle Kit config for schemas and migrations. |
| `server/package.json` | Nest scripts plus Drizzle migration scripts and auth/database dependencies. |

Server now has auth, users/documents table schemas, Drizzle database foundation, Zod validation, typed config, standardized HTTP error responses, cookie/JWT auth guards, document ingestion, Qdrant vector search, Ollama embeddings/LLM calls, and Naive RAG chat. Server still does not have Redis, BullMQ queues, Socket.io, Swagger decorators, LangGraph, hybrid search, reranking, streaming, or memory.

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

## Naive RAG Module Current State

Implemented backend APIs are protected by the existing cookie JWT guard:

- `POST /api/v1/documents/upload`
  - Accepts multipart field `file`.
  - Supports `.txt`, `.md`, `.csv`, `.pdf`, and `.docx`.
  - Extracts text, splits it with `RecursiveCharacterTextSplitter` using chunk size `800` and overlap `100`, embeds chunks with Ollama, stores one Qdrant point per chunk, then saves document metadata in Postgres.
  - Qdrant payload fields: `chunkId`, `documentId`, `fileName`, `text`, `pageNumber` when available, and `createdAt`.
  - Success response: `{ success, message, data: { document } }`.
- `GET /api/v1/documents`
  - Returns `{ success, message, data: { documents } }`.
- `DELETE /api/v1/documents/:id`
  - Deletes matching Qdrant points by payload `documentId`, then deletes Postgres metadata.
  - Returns `{ success, message, data: { document } }`.
- `POST /api/v1/chat/ask`
  - Validates `{ question }`.
  - Embeds the question, searches Qdrant top `RAG_TOP_K` chunks, builds the fixed context-only prompt, asks Ollama, and returns `{ answer, sources }`.
  - If no chunks are retrieved, returns `I could not find this information in the uploaded document.` without calling the LLM.

RAG runtime config:

- `QDRANT_URL`, default `http://localhost:6333`
- `QDRANT_COLLECTION`, default `documents`
- `QDRANT_VECTOR_SIZE`, default `768`
- `OLLAMA_BASE_URL`, default `http://localhost:11434`
- `OLLAMA_EMBEDDING_MODEL`, default `nomic-embed-text:v1.5`
- `OLLAMA_LLM_MODEL`, default `minimax-m2.5:cloud`
- `RAG_TOP_K`, default `5`

Naive RAG intentionally excludes LangGraph, agents, memory, hybrid search, reranking, streaming, and queues.

## Current Gaps / Do Not Assume

- `TECH-STACK.md` and the architecture guides are the target direction, not proof that the feature exists.
- Usage, settings saves, forgot/reset password flows, re-indexing, and profile changes still use local/mock behavior.
- Documents and chat now call real backend APIs.
- Local runtime requires reachable Postgres, Qdrant, and Ollama services. Migrations must be applied before document metadata can persist.
- Ollama must have the embedding model and chat model available: `nomic-embed-text:v1.5` and `minimax-m2.5:cloud`.

## Pitfalls & Lessons Learned

- Keep current implementation and planned architecture explicitly separated in docs and code reviews.
- Future env work should extend typed config first. Avoid direct `process.env` or `import.meta.env` access in feature code.
- Client build currently succeeds but warns that the JS bundle is large; add route-level `React.lazy`/`Suspense` and chunking before the app grows much further.
- Several route files already hold substantial UI and local logic. Extract feature components/hooks/services as real behavior is added.
- Avoid backend shortcuts in services: planned server architecture expects controller -> service -> repository -> database, with Zod validation and standardized responses.
- `nomic-embed-text:v1.5` produces 768-dimensional vectors, so Qdrant vector size is `768`, not `1536`.
- The top-level `langchain` package was removed because it pulled LangGraph transitively. Use focused packages such as `@langchain/ollama` and `@langchain/textsplitters`.
- Manual RAG acceptance requires all runtime services to be running; automated tests mock Qdrant/Ollama behavior and do not prove those external services are reachable.
- Auth e2e tests use Supertest and may need local-bind permission in sandboxed environments.
- Client lint currently passes with existing Fast Refresh warnings in generated/shared UI/provider files.
- Update this file after significant architecture decisions, new modules, API contracts, or development pitfalls so future sessions do not re-discover the same context.

## Quick Verification Snapshot

- Client verification after auth module: `npm run build` from `client/` passed, with a large-chunk warning.
- Client lint after auth module: `npm run lint` from `client/` passed with existing Fast Refresh warnings only.
- Server verification after auth module: `npm run build` and `npm test -- --runInBand` from `server/` passed.
- Server e2e verification after auth module: `npm run test:e2e -- --runInBand` from `server/` passed when local server binding was permitted.
- RAG verification after Naive RAG module: `npm run build` and `npm test -- --runInBand` from `server/` passed.
- RAG client verification after Naive RAG module: `npm run build` from `client/` passed, with the existing large-chunk warning.
- Manual RAG acceptance was not run in this environment because Qdrant at `localhost:6333` and Ollama at `localhost:11434` were not reachable.
