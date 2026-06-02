# Task 09: Add Swagger Coverage

## Goal

Bring the server in line with the project rule requiring Swagger documentation for every endpoint and response.

## Scope

- Add Swagger bootstrap setup.
- Add controller decorators for auth, CSRF, documents, and chat endpoints.
- Document success and error responses.

## Implementation Details

- Keep documentation close to controllers.
- Include auth, CSRF, validation, rate limit, not-found, and server-error cases.

## Completion Criteria

- Swagger UI or JSON is available in non-production or configured environments.
- Controllers document expected responses.
- Build passes.

## Test Cases

- Swagger document generation succeeds.
- Build catches decorator/type issues.

## Review Gate

Stop after this task and wait for user review before starting Task 10.

## Completion Notes

- Added `@nestjs/swagger` and `swagger-ui-express`.
- Added non-production Swagger setup:
  - Swagger UI: `/api/docs`
  - Swagger JSON: `/api/docs-json`
- Added controller documentation for auth, CSRF, documents, and chat endpoints.
- Documented auth cookie and CSRF header security schemes.
- Documented success responses and expected validation, auth, CSRF, rate-limit, not-found, and server-error cases.
- Added reusable OpenAPI schemas for standard envelopes and RAG domain objects.
- Added Swagger document generation tests.

## Verification

- `npm test -- openapi.spec.ts --runInBand` from `server/` passed with `1` suite and `2` tests.
- `npm run build` from `server/` passed.
