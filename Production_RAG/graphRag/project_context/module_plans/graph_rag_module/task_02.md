# Task 02: Neo4j Infrastructure

## Goal
Add Neo4j as a shared infrastructure service that all graph-aware modules consume.

## Scope
- `server/src/config/neo4j.config.ts` — typed config object.
- `server/src/config/env.ts` — add `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE`.
- `server/.env.example` — document the four Neo4j env vars.
- `server/src/services/neo4j/neo4j.service.ts` — wraps `neo4j-driver`, exposes `read()`, `write()`, and `ensureConstraints()`.
- `server/src/services/neo4j/neo4j.module.ts` — global module exporting `Neo4jService`.
- `server/src/app.module.ts` — import `Neo4jModule`.
- Install `neo4j-driver` via npm.

## Implementation Details

### env.ts additions
```
NEO4J_URI: z.string().url().default('bolt://localhost:7687'),
NEO4J_USERNAME: z.string().min(1).default('neo4j'),
NEO4J_PASSWORD: z.string().min(1).default('password'),
NEO4J_DATABASE: z.string().min(1).default('neo4j'),
```

### Neo4jService
- Constructor: creates a `neo4j.driver(uri, auth.basic(user, pass))` instance.
- `onModuleInit()`: calls `ensureConstraints()`.
- `onModuleDestroy()`: calls `driver.close()`.
- `ensureConstraints()`: runs idempotent Cypher to create:
  - Unique constraints on `Entity.id` and `Chunk.id`.
  - Composite indexes on `Entity(userId, documentId)` and `Chunk(userId, documentId)`.
  - Full-text index `entityNameIndex` on `Entity(name, description)`.
- `read<T>(cypher, params)`: opens a read session on the configured database, runs the query, returns `T[]` (records mapped via helper).
- `write<T>(cypher, params)`: same for write sessions.

## Completion Criteria
- `npm run build` from `server/` passes.
- `Neo4jService` can be injected and `ensureConstraints()` runs without error when Neo4j is available.
- No direct `process.env` access; all values come through `neo4jConfig`.

## Review Gate
Stop here. Show the user the new files and wait for approval before proceeding to Task 03.
