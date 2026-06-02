import * as React from "react";
import { isRouteErrorResponse, Link, Outlet, useRouteError } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { clientLogger } from "@/lib/client-logger";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

function getRouteErrorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return error.statusText || `Request failed with status ${error.status}`;
  }

  if (import.meta.env.DEV && error instanceof Error) {
    return error.message;
  }

  return "The page could not be loaded. Retry the request or return to the app.";
}

export function RouteErrorPage() {
  const error = useRouteError();
  const message = getRouteErrorMessage(error);

  React.useEffect(() => {
    clientLogger.error("route.boundary_error", error, {
      status: isRouteErrorResponse(error) ? error.status : undefined,
    });
  }, [error]);

  return (
    <ThemeProvider>
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-5xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-4 text-sm text-muted-foreground">{message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Retry
            </button>
            <Link
              to="/app/chat"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Back to app
            </Link>
          </div>
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}

export function RootLayout() {
  return (
    <ThemeProvider>
      <Outlet />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
