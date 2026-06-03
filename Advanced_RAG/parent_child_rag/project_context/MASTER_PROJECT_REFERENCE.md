# Master Project Reference

Read this file first in future sessions. It is the compact map of what exists now, what is only planned, and what mistakes to avoid.

## Read This First

- `client/` is the React frontend. It has real auth flows, protected app routes, API-backed document upload/list/delete, and API-backed persisted RAG conversations with document scoping and SSE streaming.
- `server/` is the NestJS backend. It has real auth plus a learning-focused Naive RAG backend with user-owned document ingestion, persisted conversation history, document-scoped Qdrant vector search, Ollama embeddings/LLM calls, SSE chat answering, and RAG abuse controls.
- Ignore generated/vendor output while reasoning about the app: `client/node_modules/`, `server/node_modules/`, `client/dist/`, `server/dist/`.
- Detailed target guides live in:
  - `project_context/TECH-STACK.md`
  - `project_context/architecture/CLIENT_STRUCTURE_GUIDE.md`
  - `project_context/architecture/SERVER_STRUCTURE_GUIDE.md`
- Those guides describe the intended architecture. This file describes the current codebase state.

## Client Current Map

Current stack: Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/Radix UI primitives, lucide icons, Sonner, React Router.

Important files and folders:

| Path                                         | What it contains                                                                                                                                                                                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client/src/main.tsx`                        | Browser router setup with `/`, guarded auth routes, guarded `/app/*` routes, `RouterProvider`, TanStack Query provider, and route-level `React.lazy`/`Suspense` code splitting.                                                                            |
| `client/src/routes/__root.tsx`               | Root layout with `ThemeProvider`, `Toaster`, 404 page, and route error fallback page.                                                                                                                                                                      |
| `client/src/routes/app.tsx`                  | Authenticated app shell using sidebar, header, and nested outlet. Route access is protected by `client/src/guard/auth-guard.tsx`.                                                                                                                          |
| `client/src/routes/login.tsx`                | Real sign-in form using Zod validation, `authService.login`, HttpOnly cookie session, Zustand auth state, and navigation to `/app/chat`.                                                                                                                   |
| `client/src/routes/register.tsx`             | Real account creation form using Zod validation, `authService.register`, HttpOnly cookie session, Zustand auth state, and navigation to `/app/chat`.                                                                                                       |
| `client/src/routes/app.chat.tsx`             | API-backed persisted Naive RAG conversation orchestration. Owns queries, mutations, active conversation state, SSE stream lifecycle, Stop/retry, and send flow; presentational chat UI is split into `client/src/components/chat/*`.                       |
| `client/src/routes/app.documents.tsx`        | API-backed documents table. Loads `/api/v1/documents`, memoizes local search/filter/count derivations, deletes with `DELETE /api/v1/documents/:id`, and refreshes after upload/delete.                                                                     |
| `client/src/components/app/*`                | App header, sidebar, theme toggle, and real multipart upload dialog for `/api/v1/documents/upload`.                                                                                                                                                        |
| `client/src/components/auth/auth-layout.tsx` | Shared auth page layout.                                                                                                                                                                                                                                   |
| `client/src/components/chat/*`               | Chat UI components/helpers/constants, including conversation header/list/dialogs, message rendering, markdown rendering, and chat-specific UI types.                                                                                                       |
| `client/src/components/theme-provider.tsx`   | Light/dark/system theme context persisted in `localStorage` key `rag-theme`.                                                                                                                                                                               |
| `client/src/components/ui/*`                 | shadcn/Radix UI primitives. Treat as generated-style UI building blocks.                                                                                                                                                                                   |
| `client/src/config/*`                        | Typed client env/API config. Development can fall back to `http://localhost:3000`; production throws an explicit runtime error if `VITE_API_BASE_URL` is missing. Dynamic API path segments are URL-encoded in endpoint helpers.                           |
| `client/src/guard/*`                         | Client auth guards: `AuthGuard` protects `/app/*`, `GuestGuard` redirects authenticated users away from `/login` and `/register`, and `AuthLoading` handles session-check loading UI.                                                                      |
| `client/src/lib/api-client.ts`               | Shared fetch wrapper with `credentials: "include"`, CSRF token handling for unsafe methods, 30s timeout/abort handling, standardized API error handling, sanitized failure logging, JSON/FormData body support, and `GET`/`POST`/`PATCH`/`DELETE` helpers. |
| `client/src/lib/client-logger.ts`            | Small structured client logger with sensitive-key redaction. Currently writes to console and can later be adapted to a monitoring provider.                                                                                                                |
| `client/src/lib/query-client.ts`             | Shared TanStack Query client.                                                                                                                                                                                                                              |
| `client/src/lib/utils.ts`                    | `cn()` class-name merge helper.                                                                                                                                                                                                                            |
| `client/src/services/auth.service.ts`        | Auth API service for `register`, `login`, `logout`, and `me`.                                                                                                                                                                                              |
| `client/src/services/documents.service.ts`   | Documents API service for list, multipart upload, and delete.                                                                                                                                                                                              |
| `client/src/services/chat.service.ts`        | Chat API service for conversation CRUD/update-scope operations, message creation, and SSE message streaming.                                                                                                                                               |
| `client/src/store/auth.store.ts`             | Zustand auth store with `unknown`, `authenticated`, and `unauthenticated` states.                                                                                                                                                                          |
| `client/src/types/auth.types.ts`             | Shared auth payload, response, user, and status types.                                                                                                                                                                                                     |
| `client/src/types/document.types.ts`         | Document metadata response types used by the documents page and upload dialog.                                                                                                                                                                             |
| `client/src/types/chat.types.ts`             | Chat answer, conversation, message, stream event, and retrieved source chunk response types.                                                                                                                                                               |
| `client/src/validations/auth.validation.ts`  | Zod schemas for login and registration forms.                                                                                                                                                                                                              |
| `client/src/hooks/use-page-meta.ts`          | Sets `document.title` for pages.                                                                                                                                                                                                                           |
| `client/src/hooks/use-mobile.tsx`            | Mobile breakpoint helper.                                                                                                                                                                                                                                  |
| `client/src/styles.css`                      | Tailwind v4 setup, CSS variables, theme tokens, auth background, markdown prose, and thinking-dot animation.                                                                                                                                               |
| `client/vite.config.ts`                      | Vite plugins: React, Tailwind, tsconfig paths. Build output uses manual vendor chunks for React/router, query/state, and markdown dependencies.                                                                                                            |
| `client/public/_headers`                     | Cloudflare-compatible static security headers and immutable cache headers for hashed assets.                                                                                                                                                               |
| `client/components.json`                     | shadcn configuration and aliases.                                                                                                                                                                                                                          |

Client now has real auth/session handling, typed API services, TanStack Query provider, Zustand auth store, guarded auth/app routes, route-level lazy loading, named Vite vendor chunks, API-backed document management, and API-backed persisted RAG conversations. Chat supports header-upload document cache refresh, descriptive generated titles, inline rename, editable document scope, hard delete, streamed responses with Stop and retry-on-network-error, message timestamps, loading skeletons, buffered token rendering, and split presentational components.

## Server Current Map

Current stack: NestJS 11, TypeScript, Drizzle ORM, Postgres driver, Zod, JWT, cookie-parser, csrf-csrf, Helmet, bcryptjs, `@nestjs/throttler`, Qdrant JS client, LangChain Ollama integration, LangChain text splitters, pdf-parse, mammoth, and Multer. The backend has real auth and Naive RAG domain modules.

Important files:

| Path                                                  | What it contains                                                                                                                                                                                                                                          |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/src/main.ts`                                  | Creates `AppModule`, registers Helmet security headers, cookie parsing, CSRF protection, HTTP exception filtering, and listens on typed app config port.                                                                                                  |
| `server/src/app.module.ts`                            | Root module registering shared throttler config, database module, auth module, CSRF token module, documents module, chat module, and global JWT auth guard.                                                                                               |
| `server/src/api/v1/auth/*`                            | Auth module with register, login, logout, and current-user endpoints, plus controller/service/repository layering, throttling, and tests.                                                                                                                 |
| `server/src/api/v1/csrf/*`                            | Public CSRF token endpoint for SPA double-submit token flow.                                                                                                                                                                                              |
| `server/src/api/v1/documents/*`                       | Documents module with user-scoped upload/list/delete endpoints, upload validation, injectable parsing module, recursive chunking, embedding generation, Qdrant upsert/delete compensation, Postgres metadata repository, and focused tests.               |
| `server/src/api/v1/chat/*`                            | Chat module with persisted conversations/messages, conversation document membership, scoped Qdrant retrieval, bounded prompt construction, SSE answer streaming, rename/scope/delete endpoints, and focused tests.                                        |
| `server/src/services/qdrant/*`                        | Shared Qdrant module that ensures collection creation, upserts vector points, searches by selected document IDs, and deletes points by `documentId`.                                                                                                      |
| `server/src/services/embeddings/*`                    | Shared Ollama embeddings module using `nomic-embed-text:v1.5` and validating vector size against config.                                                                                                                                                  |
| `server/src/services/llm/*`                           | Shared Ollama chat module using configured local/cloud Ollama model for final answer generation.                                                                                                                                                          |
| `server/src/services/parsing/*`                       | Shared document parsing module with parser classes for text-like files, PDF, and DOCX.                                                                                                                                                                    |
| `server/src/services/rag-runtime/*`                   | In-process concurrency limiter for expensive RAG operations such as parsing, embeddings, Qdrant calls, and LLM streaming.                                                                                                                                 |
| `server/src/common/filters/http-exception.filter.ts`  | Standardizes Nest HTTP errors into `{ success, message, data }`.                                                                                                                                                                                          |
| `server/src/common/security/csrf-protection.ts`       | Shared `csrf-csrf` double-submit cookie protection and token generation helpers.                                                                                                                                                                          |
| `server/src/common/security/security-headers.ts`      | Shared Helmet setup for HTTP security headers, including `X-Frame-Options: DENY`.                                                                                                                                                                         |
| `server/src/common/pipes/zod-validation.pipe.ts`      | Reusable Zod request validation pipe returning `422` validation errors.                                                                                                                                                                                   |
| `server/src/config/*`                                 | Typed config modules for app, database, JWT, cookies, auth rate limits, CSRF, Qdrant, Ollama, RAG settings, and environment parsing. `env.ts` loads server `.env` values before Zod validation while preserving real environment variable precedence.     |
| `server/src/database/schemas/users.schema.ts`         | Drizzle users table schema with unique email constraint and password hash.                                                                                                                                                                                |
| `server/src/database/schemas/documents.schema.ts`     | Drizzle user-owned documents metadata table schema. Chunk text and vectors are stored in Qdrant payloads, not Postgres.                                                                                                                                   |
| `server/src/database/schemas/conversations.schema.ts` | Drizzle conversations, conversation-document join table, and conversation message schema with cascade cleanup.                                                                                                                                            |
| `server/src/database/migrations/*`                    | Drizzle migrations for users and documents metadata tables.                                                                                                                                                                                               |
| `server/src/guard/*`                                  | Global JWT auth guard, `@Public()`, `@CurrentUser()`, and authenticated request typing.                                                                                                                                                                   |
| `server/src/services/database/*`                      | Global Drizzle database module/service backed by Postgres.                                                                                                                                                                                                |
| `server/src/app.controller.spec.ts`                   | Default unit test for `GET /`.                                                                                                                                                                                                                            |
| `server/test/app.e2e-spec.ts`                         | Default e2e test scaffold.                                                                                                                                                                                                                                |
| `server/.env.example`                                 | Documents app, database, JWT, auth cookie, Qdrant, Ollama, and RAG configuration.                                                                                                                                                                         |
| `server/drizzle.config.ts`                            | Drizzle Kit config for schemas and migrations.                                                                                                                                                                                                            |
| `server/package.json`                                 | Nest scripts plus Drizzle migration scripts and auth/database dependencies.                                                                                                                                                                               |

Server now has auth, users/documents/conversations table schemas, Drizzle database foundation, Zod validation, typed config, standardized HTTP error responses, cookie/JWT auth guards, document ingestion, upload hardening, Qdrant vector search, Ollama embeddings/LLM calls, persisted conversation history, document-scoped retrieval, SSE Naive RAG chat, RAG throttling/concurrency controls, prompt context boundaries, and safe SSE error mapping. Server still does not have Redis, BullMQ queues, Socket.io, LangGraph, hybrid search, reranking, or agentic memory.

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

- `GET /api/v1/csrf-token` is public and returns `{ success: true, message, data: { csrfToken } }` while setting the HttpOnly CSRF cookie.
- Success responses use `{ success: true, message, data: { user } }`.
- Logout success uses `{ success: true, message, data: null }`.
- Error responses use `{ success: false, message, data }`.
- Safe user shape is `{ id, name, email }`; `passwordHash` is never returned.
- Auth session is an HttpOnly cookie named by `AUTH_COOKIE_NAME` (`rag_auth_token` by default).

## Parent-Child RAG Module Current State

The naive RAG flow has been fully restructured into **Parent-Child RAG** ("search small chunks, answer from bigger chunks"). Implemented backend APIs are protected by the existing cookie JWT guard.

### Document Tables

| Table | Schema file | Purpose |
|---|---|---|
| `documents` | `documents.schema.ts` | User-owned document metadata; `chunkCount` = number of child chunks (embedded vectors) |
| `document_parents` | `document-parents.schema.ts` | Parent chunk text rows; FK to `documents.id` with `onDelete: cascade`; `parentIndex` = 0-based global ordinal per document |

### Upload flow — `POST /api/v1/documents/upload`

1. Validates file (extension/MIME/size/extracted-text/chunk-count limits).
2. `splitDocumentIntoParents(parsedText)` → `ParentChunk[]`, each with `children: ChildChunk[]`. Two splitters: parent (2000 char / 200 overlap) and child (400 char / 50 overlap).
3. Caps against `maxChunkCount` on total child count (the "indexed vectors" bound).
4. Pre-generates `documentId` UUID and one `parentId` UUID per parent.
5. Embeds all child texts → builds `VectorPoint[]` with `parentId` in Qdrant payload.
6. Upserts child vectors to Qdrant.
7. **Single DB transaction**: inserts `documents` row first, then `document_parents` rows (FK order — parents must come after document).
8. On transaction failure, compensates by deleting the already-upserted Qdrant vectors.
9. `chunkCount` on the saved document = number of child chunks, not parent chunks.
10. Qdrant payload fields: `chunkId`, `documentId`, `parentId` (required), `fileName`, `text` (child text, for matching), `pageNumber`, `createdAt`.

Response: `{ success, message, data: { document } }`.

### List / Delete

- `GET /api/v1/documents` → `{ success, message, data: { documents } }`.
- `DELETE /api/v1/documents/:id` — confirms ownership, deletes Qdrant child vectors by `documentId`, deletes `documents` row → FK cascade deletes `document_parents` rows automatically. Qdrant failures leave metadata intact for retry.

### Chat retrieval flow — SSE `GET /api/v1/chat/conversations/:id/messages/:msgId/stream`

1. `embedQuery` (limiter `embedding`).
2. `qdrant.searchByDocumentIds(vector, ragConfig.childTopK, documentIds)` → child chunks with `parentId` and score, sorted score-descending.
3. `dedupeChildrenToParents(children)`: first appearance of each `parentId` = that parent's best child (preserves score order).
4. Slice to `ragConfig.parentTopK`.
5. `documentParentsRepository.findByIds(parentIds)` → full parent rows from Postgres.
6. Build `sources: RetrievedChunk[]`: `text = parent.text` (~2000 chars), `score = bestChild.score`, `documentId/fileName/createdAt/chunkId` from best child, `pageNumber` from parent. Missing parent rows are logged + skipped.
7. `formatContext` uses `source.text` (parent text) → LLM receives richer context. `maxPromptContextCharacters` (6000) caps total via `truncateEnd`.

`RetrievedChunk` / `ChunkPayload` now requires `parentId: string`. Old naive-RAG Qdrant points (no `parentId`) are **rejected** by `toRetrievedChunk` — old documents must be re-uploaded.

All other chat endpoints (conversations CRUD, message creation, SSE streaming, error codes) are unchanged.

### RAG runtime config (updated)

- `QDRANT_URL`, default `http://localhost:6333`
- `QDRANT_COLLECTION`, default `documents`
- `QDRANT_VECTOR_SIZE`, default `768`
- `OLLAMA_BASE_URL`, default `http://localhost:11434`
- `OLLAMA_EMBEDDING_MODEL`, default `nomic-embed-text:v1.5`
- `OLLAMA_LLM_MODEL`, default `minimax-m2.5:cloud`
- `RAG_TOP_K`, default `5` (kept; used only where `childTopK`/`parentTopK` haven't replaced it)
- `RAG_PARENT_CHUNK_SIZE`, default `2000`
- `RAG_PARENT_CHUNK_OVERLAP`, default `200`
- `RAG_CHILD_CHUNK_SIZE`, default `400`
- `RAG_CHILD_CHUNK_OVERLAP`, default `50`
- `RAG_CHILD_TOP_K`, default `12`
- `RAG_PARENT_TOP_K`, default `4`
- `RAG_UPLOAD_RATE_LIMIT_TTL_MS`, default `60000`
- `RAG_UPLOAD_RATE_LIMIT_LIMIT`, default `5`
- `RAG_CHAT_RATE_LIMIT_TTL_MS`, default `60000`
- `RAG_CHAT_RATE_LIMIT_LIMIT`, default `30`
- `RAG_STREAM_RATE_LIMIT_TTL_MS`, default `60000`
- `RAG_STREAM_RATE_LIMIT_LIMIT`, default `10`
- `RAG_RUNTIME_CONCURRENCY_LIMIT`, default `4`

Parent-child RAG intentionally excludes LangGraph, agents, hybrid search, reranking, and queues. It includes persisted conversation history, SSE token streaming, upload/chat/stream throttles, in-process concurrency limits, and prompt-boundary safeguards.

## Current Gaps / Do Not Assume

- `TECH-STACK.md` and the architecture guides are the target direction, not proof that the feature exists.
- Re-indexing, profile changes, and password reset APIs are not implemented.
- Documents and chat now call real backend APIs.
- Chat conversation history and selected document scope are persisted in Postgres; vector chunks remain in Qdrant.
- Legacy `POST /api/v1/chat/ask` was removed because it searched globally. Use persisted conversations plus selected document scope.
- Local runtime requires reachable Postgres, Qdrant, and Ollama services. Migrations must be applied before document metadata can persist.
- Ollama must have the embedding model and chat model available: `nomic-embed-text:v1.5` and `minimax-m2.5:cloud`.

## Pitfalls & Lessons Learned

- Keep current implementation and planned architecture explicitly separated in docs and code reviews.
- Future env work should extend typed config first. Avoid direct `process.env` or `import.meta.env` access in feature code.
- `DATABASE_URL` is required by server config and has no application-source default. Local development must provide it through server `.env` or the process environment; tests set explicit values through Jest setup.
- Auth rate limiting is intentionally scoped to credential-entry endpoints. Current defaults are `AUTH_RATE_LIMIT_LIMIT=5` and `AUTH_RATE_LIMIT_TTL_MS=60000`.
- `ThrottlerModule` is global; keep auth/upload/chat/stream throttler configuration centralized in `server/src/app.module.ts` so named throttler options do not overwrite each other.
- Helmet is enabled during bootstrap through `configureSecurityHeaders()`. E2E tests use the same helper so security headers stay covered.
- Registration password policy requires 8-128 characters plus at least one uppercase letter, one lowercase letter, and one number. The current message is `Password must contain uppercase, lowercase, and a number`.
- CSRF protection uses `csrf-csrf` double-submit tokens for unsafe methods. The client fetches `GET /api/v1/csrf-token`, sends `X-CSRF-Token`, and retries once when a stale token is rejected. `CSRF_SECRET` must be set in production.
- Client build now uses route-level `React.lazy`/`Suspense` and Vite manual chunks.
- Keep lazy-loading route components at module scope. React docs recommend declaring `lazy` components outside render paths.
- Chat streaming now buffers SSE token updates with `requestAnimationFrame`; avoid reverting to one React state update per token.
- Several route files still hold orchestration logic. Continue extracting feature components/hooks/services as real behavior is added.
- Avoid backend shortcuts in services: planned server architecture expects controller -> service -> repository -> database, with Zod validation and standardized responses.
- `nomic-embed-text:v1.5` produces 768-dimensional vectors, so Qdrant vector size is `768`, not `1536`.
- The top-level `langchain` package was removed because it pulled LangGraph transitively. Use focused packages such as `@langchain/ollama` and `@langchain/textsplitters`.
- Shared RAG infrastructure lives under `server/src/services/*`, not under `server/src/api/v1/*`. Keep API modules focused on HTTP/domain orchestration.
- Do not reintroduce unscoped vector search or a global ask endpoint. Retrieval must stay scoped through owned conversations and their selected document IDs.
- Uploaded document text and conversation history are untrusted prompt data. Keep prompt boundaries and budgets in place when changing answer generation.
- SSE streaming should validate conversation ownership before message lookup and should emit stable public errors, not raw exception messages.
- Server TypeScript now enables `noImplicitAny`, `strictBindCallApply`, and `noFallthroughCasesInSwitch`; keep new backend code compatible with those checks.
- `server/.env`, `server/dist/`, and `server/node_modules/` are intentionally ignored. Do not stage generated/runtime output.
- Manual RAG acceptance requires all runtime services to be running; automated tests mock Qdrant/Ollama behavior and do not prove those external services are reachable.
- Document parsing now uses injectable parser classes under `server/src/services/parsing/`; do not add new file-type extraction back into ad hoc helpers.
- Auth e2e tests use Supertest and may need local-bind permission in sandboxed environments.
- Client lint currently passes with 7 existing Fast Refresh warnings in generated/shared UI/provider files. The previous chat hook dependency warnings were resolved during client production optimization.
- Client production builds require `VITE_API_BASE_URL`. Development still falls back to `http://localhost:3000`, but production no longer silently points to localhost when this env var is missing.
- Client API requests have a default 30s timeout, caller abort support, dynamic path segment encoding, and sanitized structured error logging.
- Client upload validation is defense in depth only. Browser checks enforce `.pdf`, `.docx`, `.txt`, `.csv`, `.md`, and `50 MB`, but server validation remains authoritative.
- Cloudflare static security headers are configured in `client/public/_headers`; verify deployed response headers after each hosting change.
- `npm audit --audit-level=high` has no high/critical client findings as of the client production optimization work. The remaining moderate `ws` advisory is in the Cloudflare/miniflare/wrangler toolchain; npm only offers a breaking forced fix that downgrades `@cloudflare/vite-plugin` to `0.1.1`, so it is deferred.
- Conversation deletion is hard delete only. Do not assume archive/soft-delete behavior exists unless a future schema change adds it.
- SSE retry is client-side and retries the same persisted user message ID. It avoids duplicate user messages, but a server-side stream that already completed and persisted an assistant response before the network error may still require future idempotency safeguards.
- Update this file after significant architecture decisions, new modules, API contracts, or development pitfalls so future sessions do not re-discover the same context.
- **Parent-child FK ordering**: in `createWithParents`, insert the `documents` row **first**, then `document_parents`. Inserting parents first violates the FK (`document_id` not yet in `documents`) and throws a 23503 error at runtime even though the unit tests (which mock the transaction) would never catch it.
- **Old Qdrant data incompatible with parent-child**: existing naive-RAG Qdrant points have no `parentId` in their payload. `toRetrievedChunk` now rejects such points (returns `null`). Re-upload all documents after switching to parent-child RAG.
- **CSRF session binding**: `getSessionIdentifier` in `csrf-protection.ts` binds the CSRF token to the auth cookie. Any request that carries the auth cookie must have its CSRF token fetched **with** that auth cookie, or validation will fail with 403. In e2e / curl tests, pass the auth cookie when calling `GET /api/v1/csrf-token`.
- **`chunkCount` = child count**: the `documents.chunk_count` column counts embedded child vectors, not parent rows. Document the distinction clearly; parent row count can be queried from `document_parents` by `document_id`.
- **`DocumentParentsRepository` single instance**: export it from `DocumentsModule` (already imported by `ChatModule`). Do not add it to `ChatModule.providers` — that would create a second DI instance.

## Quick Verification Snapshot

- Client verification after auth module: `npm run build` from `client/` passed, with a large-chunk warning.
- Client lint after auth module: `npm run lint` from `client/` passed with existing Fast Refresh warnings only.
- Server verification after auth module: `npm run build` and `npm test -- --runInBand` from `server/` passed.
- Server e2e verification after auth module: `npm run test:e2e -- --runInBand` from `server/` passed when local server binding was permitted.
- RAG verification after Naive RAG module: `npm run build` and `npm test -- --runInBand` from `server/` passed.
- Document parsing refactor verification: targeted document specs passed with `npm test -- --runTestsByPath src/api/v1/documents/documents.service.spec.ts src/api/v1/documents/helpers/text-splitter.spec.ts src/api/v1/documents/parsing/document-parsing.service.spec.ts src/api/v1/documents/pipes/document-upload-validation.pipe.spec.ts --runInBand`, and `npm run build` from `server/` passed. `npm test -- documents --runInBand` was attempted but ran broader suites and failed in pre-existing dirty `auth.service.spec.ts` mocks missing `checkEmailExists`.
- RAG client verification after Naive RAG module: `npm run build` from `client/` passed, with the existing large-chunk warning.
- Manual RAG acceptance was not run in this environment because Qdrant at `localhost:6333` and Ollama at `localhost:11434` were not reachable.
- Conversation improvements verification: `npm test -- chat.service.spec.ts --runInBand` and `npm run build` from `server/` passed; `npm run lint` from `client/` passed with existing warnings only; `npm run build` from `client/` passed with the existing large-chunk warning.
- Auth logout hardening verification: `npm test -- auth.controller.spec.ts --runInBand`, `npm run build` from `server/`, `npm run test:e2e -- auth.e2e-spec.ts --runInBand` with local-bind permission, `npm run lint` from `client/`, and `npm run build` from `client/` passed. At that time client lint still reported Fast Refresh and chat hook dependency warnings; the chat hook dependency warnings were later resolved during client production optimization.
- Auth env hardening verification: `npm test -- env.spec.ts --runInBand`, `npm test -- auth.controller.spec.ts --runInBand`, `npm test -- --runInBand`, `npm run build` from `server/`, and `npm run test:e2e -- auth.e2e-spec.ts --runInBand` with local-bind permission passed.
- Auth rate-limit verification: `npm test -- auth.controller.spec.ts --runInBand`, `npm test -- env.spec.ts --runInBand`, `npm test -- --runInBand`, `npm run build` from `server/`, and `npm run test:e2e -- auth.e2e-spec.ts --runInBand` with local-bind permission passed. Auth e2e now includes `429` coverage for login and registration.
- Security headers verification: `npm run build` from `server/`, `npm test -- app.controller.spec.ts --runInBand`, `npm test -- --runInBand`, `npm run test:e2e -- app.e2e-spec.ts --runInBand` with local-bind permission, and `npm run test:e2e -- auth.e2e-spec.ts --runInBand` with local-bind permission passed.
- Password complexity verification: `npm test -- register.dto.spec.ts --runInBand`, `npm test -- auth.service.spec.ts --runInBand`, `npm test -- auth.controller.spec.ts --runInBand`, `npm test -- --runInBand`, `npm run build` from `server/`, `npm run build` from `client/`, `npm run lint` from `client/`, and `npm run test:e2e -- auth.e2e-spec.ts --runInBand` with local-bind permission passed. At that time client lint still reported Fast Refresh and chat hook dependency warnings; the chat hook dependency warnings were later resolved during client production optimization.
- CSRF verification: `npm test -- env.spec.ts --runInBand`, `npm test -- auth.controller.spec.ts --runInBand`, `npm test -- --runInBand`, `npm run build` from `server/`, `npm run build` from `client/`, `npm run lint` from `client/`, `npm run test:e2e -- app.e2e-spec.ts --runInBand` with local-bind permission, and `npm run test:e2e -- auth.e2e-spec.ts --runInBand` with local-bind permission passed. Auth e2e now includes CSRF token issuance and missing-token rejection coverage.
- Client production optimization verification: `npm run lint`, `npm run build`, and `npm audit --audit-level=high` from `client/` passed. Lint still reports 7 existing Fast Refresh warnings only. Audit reports no high/critical advisories and defers the moderate Cloudflare/miniflare/wrangler `ws` chain because npm only offers a breaking forced fix.
- Client final bundle snapshot after production optimization: entry app chunk `47.90 kB` minified / `14.75 kB` gzip; eager `vendor-react` `283.60 kB` / `90.94 kB` gzip; eager `vendor-query-state` `36.25 kB` / `10.77 kB` gzip; lazy `vendor-markdown` `156.79 kB` / `47.47 kB` gzip; `app.chat` route chunk `37.21 kB` / `11.47 kB` gzip. Baseline before optimization was one JS bundle at `1,240.45 kB` minified / `364.41 kB` gzip with a Vite large-chunk warning.
- Client production optimization manual smoke tests were not run in this environment because the full backend/runtime stack is not active here.
- Server scrutiny optimization verification:
  - `npm run build` from `server/` passed after enabling stricter TypeScript flags.
  - `npm test -- chat.controller.spec.ts documents.controller.spec.ts rag-concurrency-limiter.service.spec.ts chat.service.spec.ts documents.service.spec.ts --runInBand` from `server/` passed with `5` suites and `45` tests after RAG abuse controls.
  - `git ls-files Naive_RAG/server/.env Naive_RAG/server/dist Naive_RAG/server/node_modules` returned no tracked runtime/generated paths.
  - `git check-ignore -v Naive_RAG/server/.env Naive_RAG/server/dist Naive_RAG/server/node_modules` confirmed ignore coverage from `server/.gitignore`.
- App scope cleanup verification: `npm run lint` and `npm run build` from `client/` passed; `npm run build`, `npm test -- --runInBand`, and `npm run test:e2e -- auth.e2e-spec.ts --runInBand` from `server/` passed. Auth e2e required local-bind permission for Supertest.
- Parent-child RAG verification (2026-06-03): `npm run build` passed; `npm test` (unit, 16 suites / 103 tests) all green; e2e test `test/parent-child.e2e-spec.ts` passed against live infra (Postgres `parent_child_rag` DB, Qdrant, Ollama). Confirmed: upload creates `document_parents` rows with correct `parentIndex`, FK cascade deletes parent rows when document is deleted. Bug fixed during E2E: `createWithParents` was inserting parents before the document row — corrected to insert document first.
