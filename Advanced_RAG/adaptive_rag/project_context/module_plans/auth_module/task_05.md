# Task 05: Client Auth Infrastructure

## Goal

Add reusable client-side infrastructure for calling auth APIs and storing authenticated user state.

## Scope

- Add typed environment and API config.
- Add shared API client.
- Add auth service.
- Add auth types.
- Add auth validation schemas.
- Add auth Zustand store.
- Add TanStack Query provider if it is missing.

## Implementation Details

- Work under `Naive_RAG/client/src`.
- Add:
  - `config/env.config.ts`
  - `config/api.config.ts`
  - `lib/api-client.ts`
  - `services/auth.service.ts`
  - `types/auth.types.ts`
  - `validations/auth.validation.ts`
  - `store/auth.store.ts`
- API client must send `credentials: "include"` for cookie-based auth.
- Auth service must include:
  - `register`
  - `login`
  - `me`
- Auth store must track:
  - `user`
  - `status` or equivalent unknown/authenticated/unauthenticated state
  - actions for setting and clearing user state
- Add a QueryClient provider at the app root if absent.
- Do not modify login/register form behavior in this task beyond imports needed for infrastructure.

## Completion Criteria

- Auth service exposes typed register, login, and me calls.
- API client centralizes base URL and credentials behavior.
- Auth validation schemas match the server API contracts.
- Auth store can represent unknown, authenticated, and unauthenticated states.
- TanStack Query is available app-wide.
- Client still builds.

## Test Cases

- Run `npm run build` from `Naive_RAG/client`.
- Run `npm run lint` from `Naive_RAG/client` where practical.
- Type-check that auth service payload and response types match API contracts.
- Confirm `credentials: "include"` is configured in the API client.
- Confirm no route component performs direct `fetch` calls.
- Confirm login/register forms still render after infrastructure is added.

## Review Gate

After completing this task, update `auth_module_plan.md`, stop, and ask the user to review before Task 06.
