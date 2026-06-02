# Task 02: Route-Level Code Splitting

## Goal

Reduce the initial JavaScript bundle by lazy-loading route modules instead of statically importing every screen in `src/main.tsx`.

## Scope

- Update route setup in `src/main.tsx`.
- Lazy-load route pages with React `lazy` and `Suspense`, or the closest React Router-compatible lazy route pattern.
- Include a lightweight route fallback component.
- Preserve current guarded route behavior.

## Implementation Details

- Current hotspot: `src/main.tsx` statically imports `ChatPage`, `DocumentsPage`, `UsagePage`, `SettingsPage`, auth pages, and layout modules.
- Convert route components to top-level lazy declarations.
- Add default exports to route modules only if needed for clean `lazy(() => import(...))`.
- Keep `RootLayout`, guards, and router behavior stable.
- Do not change visual behavior except loading fallback during route chunk fetches.

## Completion Criteria

- Initial build output contains multiple JS route chunks.
- Main entry chunk is meaningfully smaller than the baseline `1,240.45 kB` minified JS file.
- Route navigation still works for login, register, chat, documents, usage, settings, forgot password, and reset password.

## Test Cases

- Run `npm run build` from `client/`.
- Run `npm run lint` from `client/`.
- Manually verify route fallback behavior when using a local dev server if available.

## Review Gate

Stop after this task and wait for user review before starting Task 03.
