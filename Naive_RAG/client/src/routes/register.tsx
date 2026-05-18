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
import { registerValidationSchema, type RegisterFormValues } from "@/validations/auth.validation";
import { toast } from "sonner";

type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;

export function RegisterPage() {
  usePageMeta("Create account - RAG Assistant");
  const navigate = useNavigate();
  const setAuthenticatedUser = useAuthStore((state) => state.setAuthenticatedUser);
  const [formErrors, setFormErrors] = useState<RegisterFormErrors>({});
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (response) => {
      setAuthenticatedUser(response.data.user);
      toast.success("Account created", { description: "Welcome to RAG Assistant." });
      navigate("/app/chat");
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "Unable to create account. Please try again.";

      toast.error("Registration failed", { description: message });
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsedPayload = registerValidationSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsedPayload.success) {
      const fieldErrors = parsedPayload.error.flatten().fieldErrors;
      setFormErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      });
      return;
    }

    setFormErrors({});
    registerMutation.mutate(parsedPayload.data);
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start chatting with your documents in minutes"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Ada Lovelace"
            required
            autoComplete="name"
            aria-invalid={Boolean(formErrors.name)}
            aria-describedby={formErrors.name ? "name-error" : undefined}
          />
          {formErrors.name ? (
            <p id="name-error" className="text-xs text-destructive">
              {formErrors.name}
            </p>
          ) : null}
        </div>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            required
            autoComplete="new-password"
            aria-invalid={Boolean(formErrors.password)}
            aria-describedby={formErrors.password ? "password-error" : undefined}
          />
          {formErrors.password ? (
            <p id="password-error" className="text-xs text-destructive">
              {formErrors.password}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repeat password"
            required
            autoComplete="new-password"
            aria-invalid={Boolean(formErrors.confirmPassword)}
            aria-describedby={formErrors.confirmPassword ? "confirm-password-error" : undefined}
          />
          {formErrors.confirmPassword ? (
            <p id="confirm-password-error" className="text-xs text-destructive">
              {formErrors.confirmPassword}
            </p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Creating account..." : "Create account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  );
}
