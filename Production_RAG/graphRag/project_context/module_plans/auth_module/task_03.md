# Task 03: Server Auth API

## Goal

Implement backend registration, login, and authenticated user lookup endpoints.

## Scope

- Create `server/src/api/v1/auth`.
- Implement auth DTO schemas with Zod.
- Implement auth controller/service/repository.
- Implement registration, login, and `/me` behavior.
- Return standardized API responses.

## Implementation Details

- Add files under `server/src/api/v1/auth`.
- Follow controller -> service -> repository -> database layering.
- Register endpoint:
  - Route: `POST /api/v1/auth/register`
  - Validate `name`, `email`, `password`, and `confirmPassword`.
  - Reject duplicate email with `409`.
  - Hash password before saving.
  - Set HttpOnly auth cookie after successful registration.
  - Return safe user fields only.
- Login endpoint:
  - Route: `POST /api/v1/auth/login`
  - Validate `email` and `password`.
  - Reject invalid credentials with `401`.
  - Set HttpOnly auth cookie after successful login.
  - Return safe user fields only.
- Me endpoint:
  - Route: `GET /api/v1/auth/me`
  - Return the currently authenticated user.
- Use `{ success, message, data }` responses.
- Never return `passwordHash`.

## Completion Criteria

- `AuthModule` is registered in `AppModule`.
- `POST /api/v1/auth/register` creates a persisted user.
- `POST /api/v1/auth/login` verifies credentials.
- Both register and login set the configured HttpOnly cookie.
- `GET /api/v1/auth/me` returns the authenticated user.
- Validation failures return `422`.
- Duplicate registration returns `409`.
- Invalid login returns `401`.

## Test Cases

- Unit test successful registration.
- Unit test duplicate email registration conflict.
- Unit test password mismatch validation.
- Unit test successful login.
- Unit test invalid email/password login.
- Unit test `/me` user response excludes `passwordHash`.
- E2E test register returns `201` and sets `Set-Cookie`.
- E2E test login returns `200` and sets `Set-Cookie`.
- E2E test `/me` returns the authenticated user when a valid cookie is present.
- Run `npm run build` from `Naive_RAG/server`.
- Run `npm test -- --runInBand` from `Naive_RAG/server`.

## Review Gate

After completing this task, update `auth_module_plan.md`, stop, and ask the user to review before Task 04.
