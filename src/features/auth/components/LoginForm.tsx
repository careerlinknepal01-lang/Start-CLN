import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useLoginForm } from "../hooks/useLoginForm";
import { PasswordInput } from "./PasswordInput";
import { FormAlert } from "./FormAlert";
import { FieldError } from "./FieldError";

export function LoginForm() {
  const { form, formError, isSubmitting, onSubmit } = useLoginForm();

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Card className="w-full max-w-md border-border">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" aria-label="Sign in form">
          <FormAlert message={formError} severity="error" />

          <div className="space-y-2">
            <Label htmlFor="login-email">
              Email <span aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className="min-h-12 text-base"
              {...register("email")}
            />
            <FieldError id="login-email-error" message={errors.email?.message} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">
                Password <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline" tabIndex={-1}>
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              aria-required="true"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              {...register("password")}
            />
            <FieldError id="login-password-error" message={errors.password?.message} />
          </div>

          <Button
            type="submit"
            className="min-h-12 w-full"
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                <span aria-live="polite">Signing in…</span>
              </>
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link
              to="/signup"
              className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Create one
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
