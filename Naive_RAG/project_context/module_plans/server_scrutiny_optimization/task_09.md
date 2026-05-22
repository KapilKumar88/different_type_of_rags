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
