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

import { useSignupForm } from "../hooks/useSignupForm";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { FormAlert } from "./FormAlert";
import { FieldError } from "./FieldError";

export function SignupForm() {
  const { form, formError, isSubmitting, passwordStrength, handlePasswordChange, onSubmit } =
    useSignupForm();

  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const passwordValue = watch("password");

  return (
    <Card className="w-full max-w-md border-border">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Tell us a bit about yourself to get started.</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={onSubmit}
          className="space-y-4"
          aria-label="Create account form"
        >
          <FormAlert message={formError} severity="error" />

          <div className="space-y-2">
            <Label htmlFor="signup-name">
              Full name <span aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </Label>
            <Input
              id="signup-name"
              autoComplete="name"
              aria-required="true"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "signup-name-error" : undefined}
              className="min-h-12 text-base"
              {...register("name")}
            />
            <FieldError id="signup-name-error" message={errors.name?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">
              Email <span aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </Label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "signup-email-error" : undefined}
              className="min-h-12 text-base"
              {...register("email")}
            />
            <FieldError id="signup-email-error" message={errors.email?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">
              Password <span aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </Label>
            <PasswordInput
              id="signup-password"
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "signup-password-error" : "signup-password-strength"
              }
              {...register("password", {
                onChange: (e) => handlePasswordChange(e.target.value),
              })}
            />
            {errors.password ? (
              <FieldError id="signup-password-error" message={errors.password.message} />
            ) : (
              <div id="signup-password-strength">
                <PasswordStrengthMeter password={passwordValue ?? ""} strength={passwordStrength} />
                {!passwordValue && (
                  <p className="text-xs text-muted-foreground">
                    Use at least 8 characters with uppercase, lowercase, numbers, and symbols.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="signup-college">
                College <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <Input
                id="signup-college"
                autoComplete="organization"
                placeholder="Tribhuvan University"
                aria-required="true"
                aria-invalid={Boolean(errors.college)}
                aria-describedby={errors.college ? "signup-college-error" : undefined}
                className="min-h-12 text-base"
                {...register("college")}
              />
              <FieldError id="signup-college-error" message={errors.college?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-field">
                Field <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <Input
                id="signup-field"
                placeholder="Computer Science"
                aria-required="true"
                aria-invalid={Boolean(errors.field)}
                aria-describedby={errors.field ? "signup-field-error" : undefined}
                className="min-h-12 text-base"
                {...register("field")}
              />
              <FieldError id="signup-field-error" message={errors.field?.message} />
            </div>
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
                <span aria-live="polite">Creating account…</span>
              </>
            ) : (
              "Create account"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have one?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
