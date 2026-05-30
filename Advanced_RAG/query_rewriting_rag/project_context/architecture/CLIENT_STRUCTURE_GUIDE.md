# Client Side Project Structure Guide

## 1. Goal

This document defines how a React + Vite client application should be organized so the codebase stays:

- easy to navigate
- scalable for new features
- consistent across team members
- easy to test and maintain

---

## 2. Recommended Folder Structure

    client/
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   │   ├── common/
    │   │   ├── ui/
    │   │   └── <feature-name>/
    │   ├── config/
    │   │   ├── api.config.ts
    │   │   ├── app.config.ts
    │   │   └── env.config.ts
    │   ├── constants/
    │   │   └── api.constants.ts
    │   ├── contextapis/
    │   ├── guard/
    │   ├── hooks/
    │   ├── layouts/
    │   ├── lib/
    │   ├── pages/
    │   ├── services/
    │   ├── store/
    │   ├── types/
    │   ├── validations/
    │   ├── App.tsx
    │   ├── index.css
    │   └── main.tsx
    ├── components.json
    ├── index.html
    ├── package.json
    ├── tailwind.config.ts
    └── vite.config.ts

---

## 3. Folder Purpose

### public/
- Static files served directly without processing
- Examples: `favicon.ico`, `robots.txt`, static images

### src/assets/
- App assets imported directly by code
- Examples: logos, SVG icons, background images, fonts

### src/components/
- Reusable UI building blocks — no page-level business logic here
- Organized by scope:
  - `common/` — globally shared components (buttons, modals, loaders, empty states)
  - `ui/` — base design system primitives (shadcn/ui or your component library)
  - `<feature-name>/` — feature-scoped components (forms, cards, tables specific to a domain)

### src/config/
- Centralized configuration modules — **never access `import.meta.env` directly in app code**
- Separate files by concern:
  - `env.config.ts` — typed env variable exports
  - `api.config.ts` — base URL, timeout, headers
  - `app.config.ts` — app-level settings (pagination limits, feature flags, etc.)

### src/constants/
- Constant values used across the app, split into separate files by type
- Examples: API endpoint paths, status enums, UI label strings

### src/contextapis/
- React Context providers for app-wide state that doesn't belong in Zustand
- Examples: `ThemeProvider`, `UserProfileProvider`

### src/guard/
- Route protection wrappers
- Examples: `AuthGuard`, `RoleGuard`, `GuestGuard`

### src/hooks/
- Custom React hooks for reusable stateful logic
- File naming: `use-<name>.ts`
- Examples: `use-mobile.ts`, `use-debounce.ts`, `use-toast.ts`

### src/layouts/
- Page shell components that wrap route-level content
- Examples: `AppLayout` (sidebar + header), `AuthLayout` (centered card)

### src/lib/
- Low-level shared utilities and third-party adapters
- Should stay dependency-light and framework-agnostic where possible
- Examples: `api-client.ts` (axios instance), `query-client.ts`, `date.utils.ts`

### src/pages/
- Route-level screen components
- Each page composes components, hooks, and services — no heavy logic inline
- File naming: `PascalCase.tsx` matching the route name

### src/services/
- All API interaction logic — **never make API calls directly inside components**
- One service file per domain
- File naming: `<domain>.service.ts`
- Examples: `auth.service.ts`, `user.service.ts`, `document.service.ts`

### src/store/
- Zustand stores for global client/UI state
- One store file per domain slice
- File naming: `<domain>.store.ts`
- Examples: `auth.store.ts`, `ui.store.ts`

### src/types/
- Shared TypeScript `interface`, `type`, and `enum` definitions
- File naming: `<domain>.types.ts`
- Do not define types inline inside component or service files unless they are truly local

### src/validations/
- Zod (or equivalent) validation schemas, grouped by feature
- File naming: `<domain>.validation.ts`

---

## 4. Example Files

### Example 1: Env config (typed wrapper)
Path: `src/config/env.config.ts`

    export const envConfig = {
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
      appName: import.meta.env.VITE_APP_NAME as string,
    } as const;

### Example 2: Feature service
Path: `src/services/auth.service.ts`

    import { apiClient } from "../lib/api-client";
    import type { LoginPayload, AuthResponse } from "../types/auth.types";

    export const authService = {
      async login(payload: LoginPayload): Promise<AuthResponse> {
        const response = await apiClient.post("/api/v1/auth/login", payload);
        return response.data;
      },

      async me(): Promise<AuthResponse> {
        const response = await apiClient.get("/api/v1/auth/me");
        return response.data;
      },
    };

### Example 3: Reusable component
Path: `src/components/common/LoadingButton.tsx`

    import type { ButtonHTMLAttributes } from "react";

    type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
      loading?: boolean;
      loadingText?: string;
    };

    export function LoadingButton({
      loading = false,
      loadingText = "Please wait...",
      children,
      disabled,
      ...props
    }: LoadingButtonProps) {
      return (
        <button disabled={disabled || loading} {...props}>
          {loading ? loadingText : children}
        </button>
      );
    }

### Example 4: Custom hook
Path: `src/hooks/use-mobile.ts`

    import { useEffect, useState } from "react";

    const MOBILE_BREAKPOINT = 768;

    export function useMobile(): boolean {
      const [isMobile, setIsMobile] = useState(
        () => window.innerWidth < MOBILE_BREAKPOINT
      );

      useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
      }, []);

      return isMobile;
    }

### Example 5: Route page
Path: `src/pages/Dashboard.tsx`

    import { lazy, Suspense } from "react";
    import { AppLayout } from "../layouts/AppLayout";

    const DashboardStats = lazy(() => import("../components/dashboard/DashboardStats"));

    export default function Dashboard() {
      return (
        <AppLayout>
          <Suspense fallback={<div>Loading...</div>}>
            <DashboardStats />
          </Suspense>
        </AppLayout>
      );
    }

---

## 5. Naming and Organization Rules

| Item | Convention | Example |
|---|---|---|
| Components | `PascalCase.tsx` | `UserCard.tsx` |
| Pages | `PascalCase.tsx` | `Dashboard.tsx` |
| Hooks | `use-<name>.ts` | `use-debounce.ts` |
| Services | `<domain>.service.ts` | `auth.service.ts` |
| Stores | `<domain>.store.ts` | `auth.store.ts` |
| Types | `<domain>.types.ts` | `auth.types.ts` |
| Validations | `<domain>.validation.ts` | `auth.validation.ts` |
| Constants | `<domain>.constants.ts` | `api.constants.ts` |
| Config | `<purpose>.config.ts` | `api.config.ts` |

**Additional rules:**
- Keep page files focused on composition — extract logic into hooks and services
- Never make API calls directly inside components — use services
- Prefer many small, focused components over large monolithic ones
- Use `React.lazy` + `Suspense` for route-level and heavy components (code splitting)

---

## 6. State Management Rules

| State Type | Tool |
|---|---|
| Server/async state (API data, cache) | **TanStack Query** |
| Global client/UI state | **Zustand** |
| Local ephemeral state | `useState` / `useReducer` |
| Cross-component DOM/form state | React Context |

Do not mix these — TanStack Query handles caching and refetching; Zustand handles UI-driven global state.

---

## 7. Import Direction (Strict)

To prevent circular dependencies and keep the architecture clean:

```
pages → components, hooks, services, store, types, validations
components → hooks, lib, types
services → lib, config, types
hooks → services, lib, types
store → services, types
lib → (no internal imports — framework-agnostic utilities only)
config → (no internal imports — env only)
```

**Never** import upward in this chain (e.g., a `service` must not import from `pages` or `components`).