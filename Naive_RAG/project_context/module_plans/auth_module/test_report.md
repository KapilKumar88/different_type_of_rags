# Auth Module — E2E Test Report

**Date:** May 18, 2026  
**Tested By:** GitHub Copilot (Live Browser + API)  
**Environment:** Development (localhost)  
**Server:** `http://localhost:3000` · NestJS v11  
**Client:** `http://localhost:5173` · React 19 + Vite + TanStack Router  
**Database:** PostgreSQL (`rag_naive_rag`) via Docker (`postgres18`)  
**Test Method:** VS Code Integrated Browser (live interaction) + cURL (API-level verification)

---

## Scope

- Registration flow (client validation, server validation, happy path)
- Login flow (client validation, server validation, happy path)
- AuthGuard (unauthenticated access to protected routes)
- GuestGuard (authenticated access to guest-only routes)
- Session persistence (cookie survives page reload)
- Security properties of the auth cookie (HttpOnly)
- Server-side rejection of tampered/missing tokens

---

## Test Cases

### Registration

| ID | Test Case | Input | Expected | Actual | Status |
|----|-----------|-------|----------|--------|--------|
| R-01 | Empty form submit | All fields empty | Browser "Please fill out this field" — no API call | Native browser validation fired, no network request | ✅ PASS |
| R-02 | Name too short | Name = `"A"` (1 char) | Inline error "Name must be at least 2 characters" | Red inline error shown, no API call | ✅ PASS |
| R-03 | Password too short | Password = `"short"` (5 chars) | Inline errors on both password and confirm fields | Both errors shown: "Password must be at least 8 characters" + "Confirm password must be at least 8 characters" | ✅ PASS |
| R-04 | Password mismatch | Password ≠ Confirm password | Inline error "Passwords do not match" | Error shown on confirm field, no API call | ✅ PASS |
| R-05 | Happy path registration | Name=`Bob Newuser`, Email=`bob_newuser_001@test.com`, Password=`TestPass123!` | 201 → redirect to `/app/chat` + success toast | Redirected to `/app/chat`, toast: "Account created — Welcome to RAG Assistant." | ✅ PASS |
| R-06 | Duplicate email | Email=`ada_e2e_518@test.com` (already registered) | 409 error toast "Email already exists" | API returned `{"success":false,"message":"Email already exists","data":null}` | ✅ PASS |

### Login

| ID | Test Case | Input | Expected | Actual | Status |
|----|-----------|-------|----------|--------|--------|
| L-01 | Happy path login | Email=`ada_e2e_518@test.com`, Password=`TestPass123!` | 200 → redirect to `/app/chat` + success toast | Redirected to `/app/chat`, toast: "Signed in — Welcome back to RAG Assistant." | ✅ PASS |
| L-02 | Wrong password | Correct email + `WrongPass999!` | 401 "Invalid credentials" | `{"success":false,"message":"Invalid credentials","data":null}` | ✅ PASS |
| L-03 | Non-existent email | `ghost@nowhere.invalid` + any valid password | 401 with **same** message as wrong password — no user enumeration | `{"success":false,"message":"Invalid credentials","data":null}` — identical response | ✅ PASS |
| L-04 | Case-insensitive email | Email in UPPERCASE `ADA_E2E_518@TEST.COM` | Login succeeds (email normalised server-side) | 200, user returned with lowercase email | ✅ PASS |

### AuthGuard — Unauthenticated Access to Protected Routes

| ID | Test Case | Action | Expected | Actual | Status |
|----|-----------|--------|----------|--------|--------|
| AG-01 | Access `/app/chat` unauthenticated | Navigate without cookie | Redirect to `/login` | URL became `/login` (401 from `/me`) | ✅ PASS |
| AG-02 | Access `/app/documents` unauthenticated | Navigate without cookie | Redirect to `/login` | URL became `/login` | ✅ PASS |
| AG-03 | Access `/app/usage` unauthenticated | Navigate without cookie | Redirect to `/login` | URL became `/login` | ✅ PASS |
| AG-04 | Access `/app/settings` unauthenticated | Navigate without cookie | Redirect to `/login` | URL became `/login` | ✅ PASS |
| AG-05 | Tampered JWT cookie | Send `rag_auth_token=tampered.invalid.token` to `/me` | 401 "Invalid authentication cookie" | `{"success":false,"message":"Invalid authentication cookie","data":null}` | ✅ PASS |

### GuestGuard — Authenticated Access to Guest-Only Routes

| ID | Test Case | Action | Expected | Actual | Status |
|----|-----------|--------|----------|--------|--------|
| GG-01 | Authenticated user visits `/login` | Navigate while cookie is valid | Redirect to `/app/chat` | URL became `/app/chat` immediately | ✅ PASS |
| GG-02 | Authenticated user visits `/register` | Navigate while cookie is valid | Redirect to `/app/chat` | URL became `/app/chat` immediately | ✅ PASS |

### Session & Cookie

| ID | Test Case | Action | Expected | Actual | Status |
|----|-----------|--------|----------|--------|--------|
| SC-01 | Session persistence | Reload `/app/chat` while authenticated | Stay on `/app/chat` (cookie survives reload) | Stayed on `/app/chat` after full reload | ✅ PASS |
| SC-02 | HttpOnly cookie — JS inaccessibility | `document.cookie` in browser console | `rag_auth_token` must NOT appear | `document.cookie` returned `""` — token invisible to JS | ✅ PASS |
| SC-03 | Root `/` redirect | Navigate to `http://localhost:5173/` | Redirect to `/login` (unauthenticated) or `/app/chat` (authenticated) | Correctly followed redirect chain | ✅ PASS |

---

## Overall Results

| Category | Total | Passed | Failed |
|----------|-------|--------|--------|
| Registration | 6 | 6 | 0 |
| Login | 4 | 4 | 0 |
| AuthGuard | 5 | 5 | 0 |
| GuestGuard | 2 | 2 | 0 |
| Session & Cookie | 3 | 3 | 0 |
| **Total** | **20** | **20** | **0** |

---

## Remediation Status

| ID | Finding | Status | Remediation |
|----|---------|--------|-------------|
| SEC-01 | No server-side logout | ✅ Fixed | Task 09 added `POST /api/v1/auth/logout` and wired client sign-out to clear the HttpOnly cookie server-side. |
| SEC-02 | Hardcoded default database credentials | ✅ Fixed | Task 10 removed the source-code `DATABASE_URL` default, added `.env` loading, and added config tests. |
| SEC-03 | No rate limiting on auth endpoints | ✅ Fixed | Task 11 added `@nestjs/throttler` limits to login and registration with `429` e2e coverage. |
| SEC-04 | No HTTP security headers | ✅ Fixed | Task 12 added Helmet security headers with e2e assertions. |
| SEC-05 | No password complexity rules | ✅ Fixed | Task 13 added server/client registration password complexity validation and tests. |
| SEC-05 | No CSRF protection beyond `SameSite=Lax` | ✅ Fixed | Task 14 added `csrf-csrf` double-submit protection and client `X-CSRF-Token` handling. |

**Current status:** All security findings from this report have been remediated in Tasks 09-14. Task 15 records this closure status.

---

## Issues Found

### 🔴 CRITICAL — No Server-Side Logout

**ID:** SEC-01  
**Severity:** Critical  
**File:** `server/src/` (missing endpoint)

The "Sign out" button in the sidebar clears the Zustand client store only. It does **not** call any server endpoint. The `rag_auth_token` HttpOnly cookie remains in the browser and continues to be accepted by the server.

**Impact:** After a user clicks Sign out:
- The cookie is still valid on the server.
- Anyone with access to the same browser profile can visit `/app/chat` and be authenticated.
- There is no way for the user to truly invalidate their session.

**Reproduction:**
1. Log in → land on `/app/chat`.
2. Click user avatar → click "Sign out".
3. Observe the page stays on `/app/chat` (the in-memory state clears but the route reloads and `/me` still returns 200).
4. Navigate to `/login` → immediately redirected back to `/app/chat`.

**Fix:** Add `POST /api/v1/auth/logout` that calls `res.clearCookie('rag_auth_token')` with the same cookie options used at login. Wire the client "Sign out" to call this endpoint before clearing local state.

---

### 🔴 CRITICAL — Hardcoded Default Database Credentials in Source Code

**ID:** SEC-02  
**Severity:** Critical  
**File:** `server/src/config/env.ts` (line 3–4, now patched)

The Zod env schema had a hardcoded default:
```ts
// BEFORE (vulnerable)
const defaultDatabaseUrl = 'postgresql://username:password@localhost:5432/rag_naive_rag';
```
This caused the server to ignore the correct `DATABASE_URL` in `.env` and connect with the wrong credentials, but it also means the default would silently connect to a DB if one existed with those credentials — exposing a live app to predictable DB access if `.env` is ever missing.

**Fix Applied:** Changed default to match the actual dev credentials. For production, the field should have **no default** and fail fast at startup if `DATABASE_URL` is not set.

```ts
// RECOMMENDED for production
DATABASE_URL: z.string().url().min(1), // no .default()
```

---

### 🟠 HIGH — No Rate Limiting on Auth Endpoints

**ID:** SEC-03  
**Severity:** High  
**Endpoints:** `POST /api/v1/auth/login`, `POST /api/v1/auth/register`

There is no throttling on login or registration. An attacker can make unlimited requests:
- **Brute force login:** Try all passwords against a known email with no lockout.
- **Account enumeration via timing** (partially mitigated by same-message responses, but timing differences in bcrypt may still leak info under high volume).
- **Registration spam:** Create unlimited accounts with disposable emails.

**Fix:** Add `@nestjs/throttler` with a short-window limit (e.g., 5 requests per 60 seconds per IP) applied to auth routes.

---

### 🟠 HIGH — No HTTP Security Headers (Helmet missing)

**ID:** SEC-04  
**Severity:** High  
**File:** `server/src/main.ts`

The server does not set any security headers. Missing:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (clickjacking)
- `Content-Security-Policy`
- `Strict-Transport-Security` (relevant in staging/production)

**Fix:** Add `app.use(helmet())` in `main.ts` (`npm install helmet`).

---

### 🟡 MEDIUM — No Password Complexity Rules

**ID:** SEC-05  
**Severity:** Medium  
**File:** `server/src/api/v1/auth/dto/` (register DTO validation)

Password validation only enforces a minimum length of 8 characters. A password like `aaaaaaaa` is accepted. There are no requirements for uppercase, lowercase, digits, or special characters.

**Fix:** Add a regex rule to the Zod password schema:
```ts
password: z.string()
  .min(8)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and a number'
  })
```
Apply the same rule on the client-side validation.

---

### 🟡 MEDIUM — No CSRF Protection Beyond SameSite=Lax

**ID:** SEC-05  
**Severity:** Medium

The cookie uses `SameSite=Lax`, which prevents cross-site form POST attacks from third-party sites, but does not protect against:
- Top-level navigations that carry the cookie (Lax allows this).
- Attacks from subdomains if a subdomain were ever compromised.

For a production app, consider `SameSite=Strict` or adding a CSRF token layer (e.g., double-submit cookie pattern).

---

## Environment Issues Encountered During Testing

| Issue | Root Cause | Resolution |
|-------|------------|------------|
| Server returning 500 on all register/login calls | Old server process (with wrong DB credentials) was still running on port 3000 when a new one was started | Killed old process with `fuser -k 3000/tcp`, restarted cleanly |
| Database URL wrong at runtime | `env.ts` had hardcoded `username:password` default overriding the correct `.env` value | Fixed `defaultDatabaseUrl` in `env.ts` to `postgres:password` |
| Migrations not applied | `npm run db:migrate` had never been run against this database | Ran migration — `users` table created |
| Cookie cannot be cleared via browser tools | VS Code integrated browser does not expose `Storage.getCookies` / `Storage.setCookies` CDP methods | Used fresh browser page (no cookies) for unauthenticated tests; API-level curl for credential failure cases |
