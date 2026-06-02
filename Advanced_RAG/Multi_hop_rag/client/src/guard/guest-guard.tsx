import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";
import { AuthLoading } from "@/guard/auth-loading";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

export function GuestGuard() {
  const status = useAuthStore((state) => state.status);
  const setAuthenticatedUser = useAuthStore((state) => state.setAuthenticatedUser);
  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated);
  const shouldVerifySession = status === "unknown";
  const sessionQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
    enabled: shouldVerifySession,
    retry: false,
  });

  useEffect(() => {
    if (sessionQuery.isSuccess) {
      setAuthenticatedUser(sessionQuery.data.data.user);
      return;
    }

    if (sessionQuery.isError) {
      setUnauthenticated();
    }
  }, [
    sessionQuery.data,
    sessionQuery.isError,
    sessionQuery.isSuccess,
    setAuthenticatedUser,
    setUnauthenticated,
  ]);

  if (status === "authenticated") {
    return <Navigate to="/app/chat" replace />;
  }

  if (shouldVerifySession && (sessionQuery.isPending || sessionQuery.isFetching)) {
    return <AuthLoading />;
  }

  return <Outlet />;
}
