# Task 06: Login Flow

## Goal

Replace the mock login form submission with real backend authentication.

## Scope

- Update the existing login route.
- Validate login input.
- Call the auth service login API.
- Store authenticated user state.
- Navigate to `/app/chat` on success.
- Show useful error and pending states.

## Implementation Details

- Update `client/src/routes/login.tsx`.
- Use the auth validation schema for `email` and `password`.
- Call `authService.login` or a TanStack Query mutation wrapper.
- On success:
  - Store returned user in the auth store.
  - Show a success toast if appropriate.
  - Navigate to `/app/chat`.
- On failure:
  - Show a clear message for invalid credentials or validation errors.
  - Do not navigate.
- Disable submit while the login request is pending.
- Preserve the existing layout and visual design.
- Do not implement registration behavior in this task.

## Completion Criteria

- Login no longer uses mock success behavior.
- Login calls `POST /api/v1/auth/login`.
- Login includes cookies through the shared API client.
- Successful login stores the authenticated user.
- Failed login leaves the user on `/login`.
- Submit button is disabled during the pending request.
- Client still builds.

## Test Cases

- Run `npm run build` from `Naive_RAG/client`.
- Run `npm run lint` from `Naive_RAG/client` where practical.
- Manual test valid login:
  - Submit a valid existing email/password.
  - Confirm navigation to `/app/chat`.
  - Confirm auth store has the returned user.
- Manual test invalid login:
  - Submit wrong password.
  - Confirm an error is shown.
  - Confirm route remains `/login`.
- Manual test invalid input:
  - Submit empty or malformed email.
  - Confirm validation prevents the API call or shows a clear validation error.
- Confirm the submit button cannot be double-clicked while pending.

## Review Gate

After completing this task, update `auth_module_plan.md`, stop, and ask the user to review before Task 07.
