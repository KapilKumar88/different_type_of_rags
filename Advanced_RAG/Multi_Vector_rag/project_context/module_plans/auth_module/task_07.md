# Task 07: Registration Flow

## Goal

Replace the mock registration form submission with real backend account creation.

## Scope

- Update the existing registration route.
- Validate registration input.
- Call the auth service registration API.
- Store authenticated user state.
- Navigate to `/app/chat` on success.
- Show useful error and pending states.

## Implementation Details

- Update `client/src/routes/register.tsx`.
- Use the auth validation schema for:
  - `name`
  - `email`
  - `password`
  - `confirmPassword`
- Call `authService.register` or a TanStack Query mutation wrapper.
- On success:
  - Store returned user in the auth store.
  - Show a success toast if appropriate.
  - Navigate to `/app/chat`.
- On failure:
  - Show duplicate email errors clearly.
  - Show validation errors clearly.
  - Do not navigate.
- Disable submit while the registration request is pending.
- Preserve the existing layout and visual design.
- Do not implement forgot/reset password behavior in this task.

## Completion Criteria

- Registration no longer uses mock success behavior.
- Registration calls `POST /api/v1/auth/register`.
- Registration includes cookies through the shared API client.
- Successful registration stores the authenticated user.
- Duplicate email displays a useful error.
- Password mismatch displays a useful error.
- Submit button is disabled during the pending request.
- Client still builds.

## Test Cases

- Run `npm run build` from `Naive_RAG/client`.
- Run `npm run lint` from `Naive_RAG/client` where practical.
- Manual test valid registration:
  - Submit valid new account details.
  - Confirm navigation to `/app/chat`.
  - Confirm auth store has the returned user.
- Manual test duplicate email:
  - Submit an email that already exists.
  - Confirm duplicate email error is shown.
  - Confirm route remains `/register`.
- Manual test password mismatch:
  - Submit different password and confirm password values.
  - Confirm validation error is shown.
  - Confirm no API call is made if client validation blocks it.
- Confirm the submit button cannot be double-clicked while pending.

## Review Gate

After completing this task, update `auth_module_plan.md`, stop, and ask the user to review before Task 08.
