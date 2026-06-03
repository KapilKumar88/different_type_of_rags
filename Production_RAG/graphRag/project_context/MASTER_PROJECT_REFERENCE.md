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

Current stack: NestJS 11, TypeScript, Drizzle ORM, Postgres driver, Zod, JWT, cookie-parser, csrf-csrf, Helmet, bcryptjs, `@nestjs/throttler`, **neo4j-driver 6.0.1**, LangChain Ollama integration, LangChain text splitters, pdf-parse, mammoth, and Multer. The backend has real auth and **Graph RAG** domain modules. Qdrant and Ollama embeddings are **removed** from this project variation.

Important files:

| Path                                                  | What it contains                                                                                                                                                                                                                                          |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/src/main.ts`                                  | Creates `AppModule`, registers Helmet security headers, cookie parsing, CSRF protection, HTTP exception filtering, and listens on typed app config port.                                                                                                  |
| `server/src/app.module.ts`                            | Root module registering shared throttler config, database module, auth module, CSRF token module, documents module, chat module, and global JWT auth guard.                                                                                               |
| `server/src/api/v1/auth/*`                            | Auth module with register, login, logout, and current-user endpoints, plus controller/service/repository layering, throttling, and tests.                                                                                                                 |
| `server/src/api/v1/csrf/*`                            | Public CSRF token endpoint for SPA double-submit token flow.                                                                                                                                                                                              |
| `server/src/api/v1/documents/*`                       | Documents module with user-scoped upload/list/delete endpoints, upload validation, injectable parsing module, recursive chunking, **graph extraction per chunk**, **Neo4j graph build/delete compensation**, Postgres metadata repository, and focused tests. |
| `server/src/api/v1/chat/*`                            | Chat module with persisted conversations/messages, conversation document membership, **graph traversal retrieval**, bounded prompt construction with graph entity/relationship sections, SSE answer streaming (includes new `graph` event), rename/scope/delete endpoints, and focused tests. |
| `server/src/api/v1/graph/*`                           | Graph domain module: `GraphRepository` (all Cypher), `GraphService` (build/retrieve/visualize/delete), `GraphController` (`GET /api/v1/graph/documents/:id`). |
| `server/src/services/neo4j/*`                         | Global Neo4j service: driver lifecycle, `read()`/`write()` helpers, `ensureConstraints()` (unique/composite indexes + full-text index on `Entity(name, description)`). |
| `server/src/services/graph-extraction/*`              | LLM-based entity/relationship extraction per chunk: strict JSON prompt, Zod-parsed output, capped counts, normalized names. |
| `server/src/services/llm/*`                           | Shared Ollama chat module using configured local/cloud Ollama model for final answer generation and graph extraction calls.                                                                                                                                 |
| `server/src/services/parsing/*`                       | Shared document parsing module with parser classes for text-like files, PDF, and DOCX.                                                                                                                                                                    |
| `server/src/services/rag-runtime/*`                   | In-process concurrency limiter for expensive RAG operations: parsing, graph extraction, LLM streaming. Slots: `document-parsing`, `graph-extraction`, `llm-stream`.                                                                                       |
| `server/src/common/filters/http-exception.filter.ts`  | Standardizes Nest HTTP errors into `{ success, message, data }`.                                                                                                                                                                                          |
| `server/src/common/security/csrf-protection.ts`       | Shared `csrf-csrf` double-submit cookie protection and token generation helpers.                                                                                                                                                                          |
| `server/src/common/security/security-headers.ts`      | Shared Helmet setup for HTTP security headers, including `X-Frame-Options: DENY`.                                                                                                                                                                         |
| `server/src/common/pipes/zod-validation.pipe.ts`      | Reusable Zod request validation pipe returning `422` validation errors.                                                                                                                                                                                   |
| `server/src/config/*`                                 | Typed config modules for app, database, JWT, cookies, auth rate limits, CSRF, **Neo4j**, Ollama, **Graph**, RAG settings, and environment parsing. `env.ts` loads server `.env` values before Zod validation. **Removed**: `qdrant.config.ts`; `QDRANT_*` and `OLLAMA_EMBEDDING_MODEL` env vars removed. |
| `server/src/database/schemas/users.schema.ts`         | Drizzle users table schema with unique email constraint and password hash.                                                                                                                                                                                |
| `server/src/database/schemas/documents.schema.ts`     | Drizzle user-owned documents metadata table schema. Chunk text and graph data are stored in **Neo4j**, not Qdrant.                                                                                                                                        |
| `server/src/database/schemas/conversations.schema.ts` | Drizzle conversations, conversation-document join table, and conversation message schema. `conversation_messages` now has a `graph_context jsonb` column (migration 0004).                                                                               |
| `server/src/database/migrations/*`                    | Drizzle migrations through 0004 (`graph_context` column on `conversation_messages`).                                                                                                                                                                     |
| `server/src/guard/*`                                  | Global JWT auth guard, `@Public()`, `@CurrentUser()`, and authenticated request typing.                                                                                                                                                                   |
| `server/src/services/database/*`                      | Global Drizzle database module/service backed by Postgres.                                                                                                                                                                                                |
| `server/src/app.controller.spec.ts`                   | Default unit test for `GET /`.                                                                                                                                                                                                                            |
| `server/test/app.e2e-spec.ts`                         | Default e2e test scaffold.                                                                                                                                                                                                                                |
| `server/.env.example`                                 | Documents app, database, JWT, auth cookie, **Neo4j**, Ollama (LLM only), Graph RAG, and rate-limit configuration. Qdrant and embedding vars removed.                                                                                                     |
| `server/drizzle.config.ts`                            | Drizzle Kit config for schemas and migrations.                                                                                                                                                                                                            |
| `server/package.json`                                 | Nest scripts plus Drizzle migration scripts and auth/database dependencies.                                                                                                                                                                               |

Server now has auth, users/documents/conversations table schemas, Drizzle database foundation, Zod validation, typed config, standardized HTTP error responses, cookie/JWT auth guards, **Graph RAG**: document ingestion with LLM entity/relationship extraction → Neo4j knowledge graph, graph traversal retrieval (entity linking + neighborhood expansion), SSE chat streaming with `graph`/`sources`/`token`/`done`/`error` events, persisted `graphContext` on assistant messages, `/api/v1/graph/documents/:id` visualization endpoint, upload/chat/stream throttles, in-process concurrency limits, prompt context boundaries with graph entity/relationship sections, and safe SSE error mapping. **Removed**: Qdrant vector search, Ollama embeddings. Still does not have Redis, BullMQ queues, Socket.io, LangGraph, hybrid search, reranking, or agentic memory.

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

## Graph RAG Module Current State

Implemented backend APIs are protected by the existing cookie JWT guard:

- `POST /api/v1/documents/upload`
  - Accepts multipart field `file`. Supports `.txt`, `.md`, `.csv`, `.pdf`, and `.docx`.
  - Parses → chunks → **LLM extraction per chunk** (entities + relationships, Zod-validated JSON) → **Neo4j graph build** (Entity nodes, Chunk nodes, MENTIONED_IN + RELATED edges) → Postgres metadata.
  - Compensation: if Postgres metadata write fails, the Neo4j graph for that document is deleted.
  - Success response: `{ success, message, data: { document } }`.
- `GET /api/v1/documents` — returns `{ data: { documents } }`.
- `DELETE /api/v1/documents/:id` — deletes Neo4j graph, then Postgres metadata. Graph delete failures block metadata deletion (retryable).
- `GET /api/v1/graph/documents/:documentId` — returns `{ data: { graph: { nodes, edges } } }` for a user-owned document. Used by the client visualization page.
- All existing conversation/message endpoints remain unchanged.
- `GET /api/v1/chat/conversations/:conversationId/messages/:messageId/stream`
  - SSE endpoint. Retrieval now: extract query entities via LLM → full-text index search in Neo4j → BFS neighborhood traversal up to `GRAPH_MAX_HOPS` hops → fetch Chunk texts for found entities.
  - Emits events in order: **`graph`** `{ entities, relationships }`, `sources` (chunk texts as RetrievedChunk shape), `token`×N, `done`. Plus `error` on failure.
  - Prompt construction uses `<graph_entities>`, `<graph_relationships>`, `<retrieved_context>`, `<conversation_history>`, `<latest_user_message>` sections; all untrusted.
  - Persists assistant message with `sources` and `graphContext` (jsonb) columns.

Graph RAG runtime config:

- `NEO4J_URI`, default `bolt://localhost:7687`
- `NEO4J_USERNAME`, default `neo4j`
- `NEO4J_PASSWORD`, default `password`
- `NEO4J_DATABASE`, default `neo4j`
- `OLLAMA_BASE_URL`, default `http://localhost:11434`
- `OLLAMA_LLM_MODEL`, default `minimax-m2.5:cloud`
- `GRAPH_MAX_HOPS`, default `2`
- `GRAPH_ENTITY_SEED_LIMIT`, default `5`
- `GRAPH_NEIGHBOR_LIMIT`, default `20`
- `GRAPH_MAX_CONTEXT_CHARACTERS`, default `6000`
- `GRAPH_MAX_ENTITIES_PER_CHUNK`, default `8`
- `GRAPH_MAX_RELATIONSHIPS_PER_CHUNK`, default `10`
- `RAG_UPLOAD_RATE_LIMIT_TTL_MS`, default `60000`
- `RAG_UPLOAD_RATE_LIMIT_LIMIT`, default `5`
- `RAG_CHAT_RATE_LIMIT_TTL_MS`, default `60000`
- `RAG_CHAT_RATE_LIMIT_LIMIT`, default `30`
- `RAG_STREAM_RATE_LIMIT_TTL_MS`, default `60000`
- `RAG_STREAM_RATE_LIMIT_LIMIT`, default `10`
- `RAG_RUNTIME_CONCURRENCY_LIMIT`, default `4`

Neo4j graph model:
- `(:Entity { id, userId, documentId, name, normalizedName, type, description, createdAt })`
- `(:Chunk { id, userId, documentId, fileName, text, pageNumber?, createdAt })`
- `(:Entity)-[:MENTIONED_IN]->(:Chunk)` — entity-to-source-chunk link
- `(:Entity)-[:RELATED { id, type, description, userId, documentId, normalizedType, createdAt }]->(:Entity)`
- Constraints: unique on `Entity.id`, `Chunk.id`; composite indexes on `Entity(userId, documentId)` and `Chunk(userId, documentId)`; full-text index `entityNameIndex` on `Entity(name, description)`.

Client additions:
- `/app/graph` route: document picker + `react-force-graph-2d` force-directed visualization; entity nodes colored by type; lazy-loaded in `vendor-graph` chunk.
- Chat messages: collapsible "Knowledge graph used" panel (`ChatGraphContext`) showing entity pills and relationship rows, populated from the `graph` SSE event and persisted `graphContext`.

## Current Gaps / Do Not Assume

- `TECH-STACK.md` and the architecture guides are the target direction, not proof that the feature exists.
- Re-indexing, profile changes, and password reset APIs are not implemented.
- Documents and chat now call real backend APIs.
- Chat conversation history and selected document scope are persisted in Postgres; graph data (entities/chunks/relationships) lives in Neo4j.
- **Qdrant and Ollama embeddings are removed** from this project variation. Do not re-introduce them.
- Legacy `POST /api/v1/chat/ask` was removed. Use persisted conversations plus selected document scope.
- Local runtime requires reachable Postgres, **Neo4j**, and Ollama (LLM only) services. Migrations through 0004 must be applied. Start Neo4j: `docker run -d --name neo4j-graphrag -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:5`.
- Ollama must have the LLM model available: `minimax-m2.5:cloud` (or whatever `OLLAMA_LLM_MODEL` is set to). Embeddings model is **not** required.
- Graph extraction quality depends on the LLM model. Smaller/quantized models may produce empty or malformed JSON; `GraphExtractionService` returns empty results on failure rather than crashing.
- APOC procedures (`apoc.path.subgraphNodes`) are **not used** — the `traverseNeighborhoodSimple` method uses standard BFS with plain Cypher to avoid the APOC dependency.

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
- **Graph RAG**: Do not use APOC procedures (`apoc.path.subgraphNodes`) — they require a separate plugin install. The `traverseNeighborhoodSimple` BFS method uses plain Cypher and is APOC-free.
- **Graph RAG**: `DocumentsModule` imports `GraphModule` (one direction). `GraphModule` does NOT import `DocumentsModule` — instead it provides `DocumentsRepository` directly to avoid a circular dependency. ChatModule imports both `DocumentsModule` and `GraphModule` independently.
- **Graph RAG**: The `graph` SSE event is emitted before `sources`. Client SSE handlers must register `graph` before `sources` and `done`.
- **Graph RAG**: LLM extraction may return empty JSON or non-JSON for low-quality models. `GraphExtractionService` treats parse/validation failures as empty results (`{ entities: [], relationships: [] }`) and logs a warning — never throws. Document upload still succeeds with empty graph data.
- **Graph RAG**: The `rag-graph-extraction` concurrency slot is used for both per-chunk extraction during ingestion and query-entity extraction during retrieval. Keep them in the same slot to bound total LLM calls.
- **Graph RAG**: Client lint now reports 4 Fast Refresh warnings (down from 7 in the Naive RAG baseline — the remaining 4 are in generated UI files).

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
- Graph RAG module verification: `npm run build` from `server/` passed; `npm test -- --runInBand` passed with **90 tests across 15 suites**; `npm run lint` from `client/` passed with 4 pre-existing Fast Refresh warnings; `npm run build` from `client/` passed producing a `vendor-graph` chunk (`188.82 kB` / `62.11 kB` gzip) for `react-force-graph-2d`, `app.graph` route chunk (`5.01 kB` / `2.04 kB` gzip), and `app.chat` route chunk (`39.13 kB` / `11.88 kB` gzip). End-to-end manual smoke tests not run (Neo4j and Ollama not reachable in this environment).
