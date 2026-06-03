# Task 02: Server Foundation

## Goal

Add the minimum backend infrastructure required for real auth persistence, validation, cookie sessions, and migrations.

## Scope

- Install and configure required server dependencies.
- Add typed server config for auth and database settings.
- Add Drizzle database service.
- Add users table schema.
- Add migration support.
- Update server environment example.

## Implementation Details

- Work only inside `Naive_RAG/server` for implementation files.
- Add dependencies needed for:
  - Drizzle ORM
  - Postgres driver
  - Zod validation
  - JWT signing and verification
  - Cookie parsing
  - Password hashing
- Add development dependency for Drizzle migration tooling.
- Add config files under `server/src/config`.
- Add database service under `server/src/services/database`.
- Add schema files under `server/src/database/schemas`.
- Add `users` table with:
  - `id`
  - `name`
  - `email`
  - `passwordHash`
  - `createdAt`
  - `updatedAt`
- Export schemas from `server/src/database/schemas/index.ts`.
- Add or update `drizzle.config.ts`.
- Add migration scripts to `server/package.json`.
- Update `server/.env.example` with all required auth/database values.
- Avoid auth endpoints in this task; they belong to Task 03.

## Completion Criteria

- Server installs required auth/database dependencies.
- `server/src/config` contains typed config modules for database, JWT, cookie, app/client origin concerns.
- `server/src/services/database` exposes a reusable Drizzle database service.
- `server/src/database/schemas/users.schema.ts` exists and is exported.
- `drizzle.config.ts` exists and points at the schema and migrations folder.
- `server/.env.example` documents required values.
- Server still compiles.

## Test Cases

- Run `npm install` in `Naive_RAG/server` if dependencies are missing.
- Run `npm run build` from `Naive_RAG/server`.
- Run `npm test -- --runInBand` from `Naive_RAG/server`.
- Run the Drizzle migration generation command and confirm it can read the schema.
- Inspect generated/updated package scripts for migration commands.
- Confirm no auth API endpoints are added in this task.

## Review Gate

After completing this task, update `auth_module_plan.md`, stop, and ask the user to review before Task 03.
