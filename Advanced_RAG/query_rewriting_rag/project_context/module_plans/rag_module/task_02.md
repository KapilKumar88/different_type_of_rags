# Task 02: Server RAG Foundation

## Goal

Add the backend foundation required for Naive RAG dependencies, configuration, document metadata persistence, and root module registration.

## Scope

- Install required server dependencies.
- Extend typed server environment validation and `.env.example`.
- Add typed RAG/Qdrant/Ollama config modules.
- Add a Drizzle `documents` schema for metadata.
- Export the schema from the database schema index.
- Register the new RAG modules in `AppModule` after their module files exist.

## Implementation Details

- Work inside `Naive_RAG/server`.
- Add dependencies for:
  - Qdrant JS client.
  - LangChain Ollama integration.
  - LangChain text splitter package.
  - PDF extraction.
  - DOCX extraction.
  - Multipart file upload support.
- Extend `server/src/config/env.ts` with:
  - `QDRANT_URL`
  - `QDRANT_COLLECTION`
  - `QDRANT_VECTOR_SIZE`
  - `OLLAMA_BASE_URL`
  - `OLLAMA_EMBEDDING_MODEL`
  - `OLLAMA_LLM_MODEL`
  - `RAG_TOP_K`
- Add focused config modules, for example `qdrant.config.ts`, `ollama.config.ts`, and `rag.config.ts`.
- Add `server/src/database/schemas/documents.schema.ts` with:
  - `id`
  - `fileName`
  - `mimeType`
  - `sizeBytes`
  - `chunkCount`
  - `createdAt`
  - `updatedAt`
- Keep chunk text/vector payloads in Qdrant, not Postgres.
- Add a migration through Drizzle after the schema is added.

## Completion Criteria

- Required RAG packages are present in `server/package.json`.
- Typed environment parsing supports Qdrant, Ollama, and retrieval settings.
- `.env.example` documents new settings.
- Document metadata schema exists and is exported.
- Drizzle can generate a migration for the new table.
- Server still compiles after foundation changes.

## Test Cases

- Run `npm install` from `Naive_RAG/server` if packages are missing.
- Run `npm run db:generate` from `Naive_RAG/server`.
- Run `npm run build` from `Naive_RAG/server`.
- Confirm no controller behavior is added before Tasks 04 and 05.

## Review Gate

After completing this task, update `rag_module_plan.md`, then continue or stop according to the user's requested workflow.
