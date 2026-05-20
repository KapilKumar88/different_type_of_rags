# Master Project Reference

Read this file first in future sessions. It is the compact map of what exists now, what is only planned, and what mistakes to avoid.

## Read This First

- `client/` is the React frontend. It has real auth flows, protected app routes, API-backed document upload/list/delete, and API-backed persisted RAG conversations with document scoping and SSE streaming. Usage/settings/password-reset screens still use mock/local behavior.
- `server/` is the NestJS backend. It has real auth plus a learning-focused Naive RAG backend with document ingestion, persisted conversation history, document-scoped Qdrant vector search, Ollama embeddings/LLM calls, and SSE chat answering.
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
| `client/src/routes/app.chat.tsx` | API-backed persisted Naive RAG conversation UI. Lists/creates/renames/deletes conversations, edits document scope, streams assistant answers over SSE, supports Stop and recoverable Retry, renders markdown/source chunks/timestamps, and shows message-shaped loading skeletons. |
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
| `client/src/lib/api-client.ts` | Shared fetch wrapper with `credentials: "include"`, standardized API error handling, JSON/FormData body support, and `GET`/`POST`/`PATCH`/`DELETE` helpers. |
| `client/src/lib/mock/data.ts` | Mock documents, chats, messages, prompts, and usage chart data. |
| `client/src/lib/query-client.ts` | Shared TanStack Query client. |
| `client/src/lib/utils.ts` | `cn()` class-name merge helper. |
| `client/src/services/auth.service.ts` | Auth API service for `register`, `login`, `logout`, and `me`. |
| `client/src/services/documents.service.ts` | Documents API service for list, multipart upload, and delete. |
| `client/src/services/chat.service.ts` | Chat API service for legacy ask, conversation CRUD/update-scope operations, message creation, and SSE message streaming. |
| `client/src/store/auth.store.ts` | Zustand auth store with `unknown`, `authenticated`, and `unauthenticated` states. |
| `client/src/types/auth.types.ts` | Shared auth payload, response, user, and status types. |
| `client/src/types/document.types.ts` | Document metadata response types used by the documents page and upload dialog. |
| `client/src/types/chat.types.ts` | Chat answer, conversation, message, stream event, and retrieved source chunk response types. |
| `client/src/validations/auth.validation.ts` | Zod schemas for login and registration forms. |
| `client/src/hooks/use-page-meta.ts` | Sets `document.title` for pages. |
| `client/src/hooks/use-mobile.tsx` | Mobile breakpoint helper. |
| `client/src/styles.css` | Tailwind v4 setup, CSS variables, theme tokens, auth background, markdown prose, and thinking-dot animation. |
| `client/vite.config.ts` | Vite plugins: React, Tailwind, tsconfig paths. |
| `client/components.json` | shadcn configuration and aliases. |

Client now has real auth/session handling, typed API services, TanStack Query provider, Zustand auth store, guarded auth/app routes, API-backed document management, and API-backed persisted RAG conversations. Chat supports header-upload document cache refresh, descriptive generated titles, inline rename, editable document scope, hard delete, streamed responses with Stop and retry-on-network-error, message timestamps, and loading skeletons. Route-level lazy loading is still not implemented. Usage, settings saves, and password reset remain mock/local.

## Server Current Map

Current stack: NestJS 11, TypeScript, Drizzle ORM, Postgres driver, Zod, JWT, cookie-parser, bcryptjs, Qdrant JS client, LangChain Ollama integration, LangChain text splitters, pdf-parse, mammoth, and Multer. The backend has real auth and Naive RAG domain modules.

Important files:

| Path | What it contains |
| --- | --- |
| `server/src/main.ts` | Creates `AppModule`, registers Helmet security headers, cookie parsing, and HTTP exception filtering, and listens on typed app config port. |
| `server/src/app.module.ts` | Root module registering app services, database module, auth module, documents module, chat module, and global JWT auth guard. |
| `server/src/app.controller.ts` | Root controller exposing public `GET /`. |
| `server/src/app.service.ts` | Returns `"Hello World!"`. |
| `server/src/api/v1/auth/*` | Auth module with register, login, and current-user endpoints, plus controller/service/repository layering and tests. |
| `server/src/api/v1/documents/*` | Documents module with upload/list/delete endpoints, text extraction helpers, recursive chunking, embedding generation, Qdrant upsert/delete, Postgres metadata repository, and focused tests. |
| `server/src/api/v1/chat/*` | Chat module with legacy `/api/v1/chat/ask`, persisted conversations/messages, conversation document membership, scoped Qdrant retrieval, SSE answer streaming, rename/scope/delete endpoints, and focused tests. |
| `server/src/api/v1/qdrant/*` | Shared Qdrant module that ensures collection creation, upserts vector points, searches by vector, and deletes points by `documentId`. |
| `server/src/api/v1/embeddings/*` | Shared Ollama embeddings module using `nomic-embed-text:v1.5` and validating vector size against config. |
| `server/src/api/v1/llm/*` | Shared Ollama chat module using configured local/cloud Ollama model for final answer generation. |
| `server/src/common/filters/http-exception.filter.ts` | Standardizes Nest HTTP errors into `{ success, message, data }`. |
| `server/src/common/security/security-headers.ts` | Shared Helmet setup for HTTP security headers, including `X-Frame-Options: DENY`. |
| `server/src/common/pipes/zod-validation.pipe.ts` | Reusable Zod request validation pipe returning `422` validation errors. |
| `server/src/config/*` | Typed config modules for app, database, JWT, cookies, auth rate limits, Qdrant, Ollama, RAG settings, and environment parsing. `env.ts` loads server `.env` values before Zod validation while preserving real environment variable precedence. |
| `server/src/database/schemas/users.schema.ts` | Drizzle users table schema with unique email constraint and password hash. |
| `server/src/database/schemas/documents.schema.ts` | Drizzle documents metadata table schema. Chunk text and vectors are stored in Qdrant payloads, not Postgres. |
| `server/src/database/schemas/conversations.schema.ts` | Drizzle conversations, conversation-document join table, and conversation message schema with cascade cleanup. |
| `server/src/database/migrations/*` | Drizzle migrations for users and documents metadata tables. |
| `server/src/guard/*` | Global JWT auth guard, `@Public()`, `@CurrentUser()`, and authenticated request typing. |
| `server/src/services/database/*` | Global Drizzle database module/service backed by Postgres. |
| `server/src/app.controller.spec.ts` | Default unit test for `GET /`. |
| `server/test/app.e2e-spec.ts` | Default e2e test scaffold. |
| `server/.env.example` | Documents app, database, JWT, auth cookie, Qdrant, Ollama, and RAG configuration. |
| `server/drizzle.config.ts` | Drizzle Kit config for schemas and migrations. |
| `server/package.json` | Nest scripts plus Drizzle migration scripts and auth/database dependencies. |

Server now has auth, users/documents/conversations table schemas, Drizzle database foundation, Zod validation, typed config, standardized HTTP error responses, cookie/JWT auth guards, document ingestion, Qdrant vector search, Ollama embeddings/LLM calls, persisted conversation history, document-scoped retrieval, and SSE Naive RAG chat. Server still does not have Redis, BullMQ queues, Socket.io, Swagger decorators, LangGraph, hybrid search, reranking, or agentic memory.

## Auth Module Current State

Implemented scope:

- `POST /api/v1/auth/register` validates name/email/password/confirmPassword, requires registration passwords to contain uppercase, lowercase, and a number, rejects duplicate email with `409`, hashes passwords, creates users, sets the HttpOnly auth cookie, and returns safe user fields.
- `POST /api/v1/auth/login` validates email/password, rejects invalid credentials with `401`, sets the HttpOnly auth cookie, and returns safe user fields.
- `POST /api/v1/auth/logout` is idempotent/public, clears the configured HttpOnly auth cookie, and returns `{ success: true, message: 'Logout successful', data: null }`.
- `GET /api/v1/auth/me` is protected by the global JWT guard and returns the guard-provided authenticated user.
- `POST /api/v1/auth/register` and `POST /api/v1/auth/login` are rate-limited with `@nestjs/throttler`, defaulting to 5 requests per 60 seconds per client.
- Client login/register forms call the backend through `authService`, validate with Zod, store the returned user in Zustand, and navigate to `/app/chat` on success.
- Client registration validation mirrors the server password complexity rule. Login validation remains length-based so existing users are not blocked at sign-in.
- Client sidebar sign-out calls `authService.logout()` before clearing Zustand auth state and navigating to `/login`.
- Client `/app/*` routes verify session state through `/api/v1/auth/me`; unauthenticated users redirect to `/login`.
- Client `/login` and `/register` redirect authenticated users to `/app/chat`.

Auth API response contracts:

- Success responses use `{ success: true, message, data: { user } }`.
- Logout success uses `{ success: true, message, data: null }`.
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
- `GET /api/v1/chat/conversations`
  - Returns the authenticated user's conversations with `documentIds`, ordered by most recently updated.
- `POST /api/v1/chat/conversations`
  - Validates `{ title?, documentIds }`, deduplicates and validates document IDs, creates a conversation and document membership rows, and returns `{ conversation }`.
- `GET /api/v1/chat/conversations/:conversationId`
  - Returns an owned conversation with `documentIds` and ordered persisted messages.
- `PATCH /api/v1/chat/conversations/:conversationId`
  - Validates `{ title }`, confirms ownership, updates `title`/`updatedAt`, and returns `{ conversation }`.
- `PATCH /api/v1/chat/conversations/:conversationId/documents`
  - Validates `{ documentIds }`, confirms ownership, deduplicates and validates document IDs, transactionally replaces document membership, and returns `{ conversation }`.
- `DELETE /api/v1/chat/conversations/:conversationId`
  - Confirms ownership, hard-deletes the conversation, and relies on FK cascade to delete messages and join rows. Documents are not deleted.
- `POST /api/v1/chat/conversations/:conversationId/messages`
  - Validates `{ content }`, confirms ownership, persists a user message, updates conversation `updatedAt`, and returns `{ message }`.
- `GET /api/v1/chat/conversations/:conversationId/messages/:messageId/stream`
  - SSE endpoint for an owned persisted user message. Retrieves only selected conversation documents from Qdrant, emits `sources`, `token`, `done`, and `error` events, and persists the assistant message on completion.

RAG runtime config:

- `QDRANT_URL`, default `http://localhost:6333`
- `QDRANT_COLLECTION`, default `documents`
- `QDRANT_VECTOR_SIZE`, default `768`
- `OLLAMA_BASE_URL`, default `http://localhost:11434`
- `OLLAMA_EMBEDDING_MODEL`, default `nomic-embed-text:v1.5`
- `OLLAMA_LLM_MODEL`, default `minimax-m2.5:cloud`
- `RAG_TOP_K`, default `5`

Naive RAG intentionally excludes LangGraph, agents, hybrid search, reranking, and queues. It now includes persisted conversation history and SSE token streaming, but not agentic memory outside the stored conversation messages.

## Current Gaps / Do Not Assume

- `TECH-STACK.md` and the architecture guides are the target direction, not proof that the feature exists.
- Usage, settings saves, forgot/reset password flows, re-indexing, and profile changes still use local/mock behavior.
- Documents and chat now call real backend APIs.
- Chat conversation history and selected document scope are persisted in Postgres; vector chunks remain in Qdrant.
- Local runtime requires reachable Postgres, Qdrant, and Ollama services. Migrations must be applied before document metadata can persist.
- Ollama must have the embedding model and chat model available: `nomic-embed-text:v1.5` and `minimax-m2.5:cloud`.

## Pitfalls & Lessons Learned

- Keep current implementation and planned architecture explicitly separated in docs and code reviews.
- Future env work should extend typed config first. Avoid direct `process.env` or `import.meta.env` access in feature code.
- `DATABASE_URL` is required by server config and has no application-source default. Local development must provide it through server `.env` or the process environment; tests set explicit values through Jest setup.
- Auth rate limiting is intentionally scoped to credential-entry endpoints. Current defaults are `AUTH_RATE_LIMIT_LIMIT=5` and `AUTH_RATE_LIMIT_TTL_MS=60000`.
- Helmet is enabled during bootstrap through `configureSecurityHeaders()`. E2E tests use the same helper so security headers stay covered.
- Registration password policy requires 8-128 characters plus at least one uppercase letter, one lowercase letter, and one number. The current message is `Password must contain uppercase, lowercase, and a number`.
- Client build currently succeeds but warns that the JS bundle is large; add route-level `React.lazy`/`Suspense` and chunking before the app grows much further.
- Several route files already hold substantial UI and local logic. Extract feature components/hooks/services as real behavior is added.
- Avoid backend shortcuts in services: planned server architecture expects controller -> service -> repository -> database, with Zod validation and standardized responses.
- `nomic-embed-text:v1.5` produces 768-dimensional vectors, so Qdrant vector size is `768`, not `1536`.
- The top-level `langchain` package was removed because it pulled LangGraph transitively. Use focused packages such as `@langchain/ollama` and `@langchain/textsplitters`.
- Manual RAG acceptance requires all runtime services to be running; automated tests mock Qdrant/Ollama behavior and do not prove those external services are reachable.
- Auth e2e tests use Supertest and may need local-bind permission in sandboxed environments.
- Client lint currently passes with existing Fast Refresh warnings in generated/shared UI/provider files.
- Client lint also reports existing hook dependency warnings in `app.chat.tsx` for the derived `conversations` and `documents` fallback arrays. They are warnings only and were not introduced as blocking errors during the conversation-improvements work.
- Conversation deletion is hard delete only. Do not assume archive/soft-delete behavior exists unless a future schema change adds it.
- SSE retry is client-side and retries the same persisted user message ID. It avoids duplicate user messages, but a server-side stream that already completed and persisted an assistant response before the network error may still require future idempotency safeguards.
- Update this file after significant architecture decisions, new modules, API contracts, or development pitfalls so future sessions do not re-discover the same context.

## Quick Verification Snapshot

- Client verification after auth module: `npm run build` from `client/` passed, with a large-chunk warning.
- Client lint after auth module: `npm run lint` from `client/` passed with existing Fast Refresh warnings only.
- Server verification after auth module: `npm run build` and `npm test -- --runInBand` from `server/` passed.
- Server e2e verification after auth module: `npm run test:e2e -- --runInBand` from `server/` passed when local server binding was permitted.
- RAG verification after Naive RAG module: `npm run build` and `npm test -- --runInBand` from `server/` passed.
- RAG client verification after Naive RAG module: `npm run build` from `client/` passed, with the existing large-chunk warning.
- Manual RAG acceptance was not run in this environment because Qdrant at `localhost:6333` and Ollama at `localhost:11434` were not reachable.
- Conversation improvements verification: `npm test -- chat.service.spec.ts --runInBand` and `npm run build` from `server/` passed; `npm run lint` from `client/` passed with existing warnings only; `npm run build` from `client/` passed with the existing large-chunk warning.
- Auth logout hardening verification: `npm test -- auth.controller.spec.ts --runInBand`, `npm run build` from `server/`, `npm run test:e2e -- auth.e2e-spec.ts --runInBand` with local-bind permission, `npm run lint` from `client/`, and `npm run build` from `client/` passed. Client lint still reports the existing Fast Refresh and chat hook dependency warnings.
- Auth env hardening verification: `npm test -- env.spec.ts --runInBand`, `npm test -- auth.controller.spec.ts --runInBand`, `npm test -- --runInBand`, `npm run build` from `server/`, and `npm run test:e2e -- auth.e2e-spec.ts --runInBand` with local-bind permission passed.
- Auth rate-limit verification: `npm test -- auth.controller.spec.ts --runInBand`, `npm test -- env.spec.ts --runInBand`, `npm test -- --runInBand`, `npm run build` from `server/`, and `npm run test:e2e -- auth.e2e-spec.ts --runInBand` with local-bind permission passed. Auth e2e now includes `429` coverage for login and registration.
- Security headers verification: `npm run build` from `server/`, `npm test -- app.controller.spec.ts --runInBand`, `npm test -- --runInBand`, `npm run test:e2e -- app.e2e-spec.ts --runInBand` with local-bind permission, and `npm run test:e2e -- auth.e2e-spec.ts --runInBand` with local-bind permission passed.
- Password complexity verification: `npm test -- register.dto.spec.ts --runInBand`, `npm test -- auth.service.spec.ts --runInBand`, `npm test -- auth.controller.spec.ts --runInBand`, `npm test -- --runInBand`, `npm run build` from `server/`, `npm run build` from `client/`, `npm run lint` from `client/`, and `npm run test:e2e -- auth.e2e-spec.ts --runInBand` with local-bind permission passed. Client lint still reports the existing Fast Refresh and chat hook dependency warnings.
