import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AuthGuard } from "@/guard/auth-guard";
import { GuestGuard } from "@/guard/guest-guard";
import { NotFoundPage, RootLayout } from "@/routes/__root";
import { queryClient } from "@/lib/query-client";
import "./styles.css";

const AppLayout = React.lazy(() =>
  import("@/routes/app").then((module) => ({ default: module.AppLayout })),
);
const ChatPage = React.lazy(() =>
  import("@/routes/app.chat").then((module) => ({ default: module.ChatPage })),
);
const DocumentsPage = React.lazy(() =>
  import("@/routes/app.documents").then((module) => ({ default: module.DocumentsPage })),
);
const SettingsPage = React.lazy(() =>
  import("@/routes/app.settings").then((module) => ({ default: module.SettingsPage })),
);
const UsagePage = React.lazy(() =>
  import("@/routes/app.usage").then((module) => ({ default: module.UsagePage })),
);
const ForgotPasswordPage = React.lazy(() =>
  import("@/routes/forgot-password").then((module) => ({ default: module.ForgotPasswordPage })),
);
const LoginPage = React.lazy(() =>
  import("@/routes/login").then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = React.lazy(() =>
  import("@/routes/register").then((module) => ({ default: module.RegisterPage })),
);
const ResetPasswordPage = React.lazy(() =>
  import("@/routes/reset-password").then((module) => ({ default: module.ResetPasswordPage })),
);

const routeLoadingElement = (
  <div className="flex min-h-[50vh] items-center justify-center px-4">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
  </div>
);

function withRouteSuspense(element: React.ReactNode) {
  return <React.Suspense fallback={routeLoadingElement}>{element}</React.Suspense>;
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { path: "/", element: <Navigate to="/login" replace /> },
      {
        element: <GuestGuard />,
        children: [
          { path: "/login", element: withRouteSuspense(<LoginPage />) },
          { path: "/register", element: withRouteSuspense(<RegisterPage />) },
        ],
      },
      { path: "/forgot-password", element: withRouteSuspense(<ForgotPasswordPage />) },
      { path: "/reset-password", element: withRouteSuspense(<ResetPasswordPage />) },
      {
        element: <AuthGuard />,
        children: [
          {
            path: "/app",
            element: withRouteSuspense(<AppLayout />),
            children: [
              { index: true, element: <Navigate to="/app/chat" replace /> },
              { path: "chat", element: withRouteSuspense(<ChatPage />) },
              { path: "documents", element: withRouteSuspense(<DocumentsPage />) },
              { path: "usage", element: withRouteSuspense(<UsagePage />) },
              { path: "settings", element: withRouteSuspense(<SettingsPage />) },
            ],
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
