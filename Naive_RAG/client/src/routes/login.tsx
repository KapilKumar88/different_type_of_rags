import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ApiClientError } from "@/lib/api-client";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { loginValidationSchema, type LoginFormValues } from "@/validations/auth.validation";
import { toast } from "sonner";

type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export function LoginPage() {
  usePageMeta("Sign in - RAG Assistant");
  const navigate = useNavigate();
  const setAuthenticatedUser = useAuthStore((state) => state.setAuthenticatedUser);
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      setAuthenticatedUser(response.data.user);
      toast.success("Signed in", { description: "Welcome back to RAG Assistant." });
      navigate("/app/chat");
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to sign in. Please try again.";

      toast.error("Sign in failed", { description: message });
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsedPayload = loginValidationSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsedPayload.success) {
      const fieldErrors = parsedPayload.error.flatten().fieldErrors;
      setFormErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setFormErrors({});
    loginMutation.mutate(parsedPayload.data);
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your workspace"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            required
            autoComplete="email"
            aria-invalid={Boolean(formErrors.email)}
            aria-describedby={formErrors.email ? "email-error" : undefined}
          />
          {formErrors.email ? (
            <p id="email-error" className="text-xs text-destructive">
              {formErrors.email}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            aria-invalid={Boolean(formErrors.password)}
            aria-describedby={formErrors.password ? "password-error" : undefined}
          />
          {formErrors.password ? (
            <p id="password-error" className="text-xs text-destructive">
              {formErrors.password}
            </p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
