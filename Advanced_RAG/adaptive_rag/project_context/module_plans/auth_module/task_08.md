# Task 08: Client Auth Guard

## Goal

Protect authenticated app routes and redirect users based on session state.

## Scope

- Add client-side auth guard behavior for `/app/*`.
- Verify session through `/api/v1/auth/me`.
- Show loading state while auth status is unknown.
- Redirect unauthenticated users to `/login`.
- Redirect authenticated users away from `/login` and `/register`.

## Implementation Details

- Add guard components or route wrappers under `client/src/guard`.
- Protect the `/app` route tree in `client/src/main.tsx` or the nearest route layout.
- On protected route entry:
  - If auth state is unknown, call `authService.me`.
  - If valid, store user and render the route.
  - If invalid, clear user and redirect to `/login`.
- For guest routes:
  - If already authenticated, redirect `/login` and `/register` to `/app/chat`.
  - If unauthenticated, render the guest route.
- Use a simple loading state while checking `/me`.
- Keep forgot/reset routes unchanged unless a redirect is required by the selected guard design.
- Do not add logout behavior unless strictly required for guard cleanup.

## Completion Criteria

- `/app/*` cannot be viewed without a valid auth cookie.
- Unauthenticated users visiting `/app/chat`, `/app/documents`, `/app/usage`, or `/app/settings` are redirected to `/login`.
- Authenticated users can refresh `/app/chat` and remain signed in.
- Authenticated users visiting `/login` or `/register` are redirected to `/app/chat`.
- Auth state is not trusted from local client state alone; `/me` verifies cookie sessions.
- Client still builds.

## Test Cases

- Run `npm run build` from `Naive_RAG/client`.
- Run `npm run lint` from `Naive_RAG/client` where practical.
- Manual test unauthenticated protected route:
  - Clear cookies.
  - Visit `/app/chat`.
  - Confirm redirect to `/login`.
- Manual test authenticated refresh:
  - Login successfully.
  - Refresh `/app/chat`.
  - Confirm route remains accessible after `/me` succeeds.
- Manual test authenticated guest redirect:
  - Login successfully.
  - Visit `/login`.
  - Confirm redirect to `/app/chat`.
  - Visit `/register`.
  - Confirm redirect to `/app/chat`.
- Manual test expired/invalid cookie:
  - Corrupt or remove auth cookie.
  - Visit `/app/chat`.
  - Confirm auth state clears and redirects to `/login`.

## Review Gate

After completing this task, update `auth_module_plan.md`, stop, and ask the user for final auth module review.
