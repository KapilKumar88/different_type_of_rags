# Task 08: Dependency and Static Hosting Security

## Goal

Reduce known client dependency and static hosting security risk.

## Scope

- Review and update dependencies where safe.
- Add static frontend security headers if deployment target supports them.
- Avoid forced breaking downgrades.

## Implementation Details

- Baseline `npm audit --audit-level=high` has no high/critical findings.
- Moderate findings:
  - `brace-expansion` through TypeScript ESLint internals.
  - `postcss`.
  - `ws` through `@cloudflare/vite-plugin`/`wrangler`/`miniflare`.
- Start with non-breaking dependency refreshes and lockfile updates.
- Do not run `npm audit fix --force` blindly because audit suggests a breaking `@cloudflare/vite-plugin` change.
- For static hosting, evaluate Cloudflare-compatible headers for:
  - Content Security Policy.
  - `X-Content-Type-Options`.
  - `Referrer-Policy`.
  - `Permissions-Policy`.
  - Frame protection, if not already handled by the serving layer.
- Keep CSP compatible with Vite-generated assets and app API calls.

## Completion Criteria

- Safe advisories are resolved or documented as deferred with reason.
- Static security headers are configured or a deployment-specific follow-up is documented.
- Build remains green.

## Test Cases

- Run `npm audit --audit-level=high` from `client/`.
- Run `npm run build` from `client/`.
- Run `npm run lint` from `client/`.
- Preview/static-host check for CSP regressions when feasible.

## Review Gate

Stop after this task and wait for user review before starting Task 09.
