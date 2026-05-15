import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AppLayout } from "@/routes/app";
import { ChatPage } from "@/routes/app.chat";
import { DocumentsPage } from "@/routes/app.documents";
import { SettingsPage } from "@/routes/app.settings";
import { UsagePage } from "@/routes/app.usage";
import { ForgotPasswordPage } from "@/routes/forgot-password";
import { LoginPage } from "@/routes/login";
import { RegisterPage } from "@/routes/register";
import { ResetPasswordPage } from "@/routes/reset-password";
import { NotFoundPage, RootLayout } from "@/routes/__root";
import { queryClient } from "@/lib/query-client";
import "./styles.css";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { path: "/", element: <Navigate to="/login" replace /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      {
        path: "/app",
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/app/chat" replace /> },
          { path: "chat", element: <ChatPage /> },
          { path: "documents", element: <DocumentsPage /> },
          { path: "usage", element: <UsagePage /> },
          { path: "settings", element: <SettingsPage /> },
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
