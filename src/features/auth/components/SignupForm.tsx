import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useSignupForm } from "../hooks/useSignupForm";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { FormAlert } from "./FormAlert";
import { FieldError } from "./FieldError";

export function SignupForm() {
  const {
    form,
    formError,
    isSubmitting,
    passwordStrength,
    handlePasswordChange,
    onSubmit,
  } = useSignupForm();

  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const passwordValue = watch("password");

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5"
      noValidate
      aria-label="Create account form"
    >
      <FormAlert message={formError} severity="error" />

      {/* ── Name (First & Last) ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signup-first-name" className="text-sm font-medium text-[#3E5375]">
            First name <span aria-hidden="true" className="text-red-500">*</span>
            <span className="sr-only">(required)</span>
          </Label>
          <Input
            id="signup-first-name"
            autoComplete="given-name"
            placeholder="John"
            aria-required="true"
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? "signup-first-name-error" : undefined}
            className="min-h-12 border-[#CBD9EC] bg-[#F7F9FC]/50 text-base shadow-sm placeholder:text-[#9DB7DD] focus-visible:ring-[#0B3D91]"
            {...register("firstName")}
          />
          <FieldError id="signup-first-name-error" message={errors.firstName?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-last-name" className="text-sm font-medium text-[#3E5375]">
            Last name <span aria-hidden="true" className="text-red-500">*</span>
            <span className="sr-only">(required)</span>
          </Label>
          <Input
            id="signup-last-name"
            autoComplete="family-name"
            placeholder="Doe"
            aria-required="true"
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={errors.lastName ? "signup-last-name-error" : undefined}
            className="min-h-12 border-[#CBD9EC] bg-[#F7F9FC]/50 text-base shadow-sm placeholder:text-[#9DB7DD] focus-visible:ring-[#0B3D91]"
            {...register("lastName")}
          />
          <FieldError id="signup-last-name-error" message={errors.lastName?.message} />
        </div>
      </div>

      {/* ── Email ── */}
      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-sm font-medium text-[#3E5375]">
          Email <span aria-hidden="true" className="text-red-500">*</span>
          <span className="sr-only">(required)</span>
        </Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-required="true"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
          className="min-h-12 border-[#CBD9EC] bg-[#F7F9FC]/50 text-base shadow-sm placeholder:text-[#9DB7DD] focus-visible:ring-[#0B3D91]"
          {...register("email")}
        />
        <FieldError id="signup-email-error" message={errors.email?.message} />
      </div>

      {/* ── Password ── */}
      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-sm font-medium text-[#3E5375]">
          Password <span aria-hidden="true" className="text-red-500">*</span>
          <span className="sr-only">(required)</span>
        </Label>
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          aria-required="true"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "signup-password-error" : "signup-password-strength"}
          className="min-h-12 border-[#CBD9EC] bg-[#F7F9FC]/50 text-base shadow-sm focus-visible:ring-[#0B3D91]"
          {...register("password", {
            onChange: (e) => handlePasswordChange(e.target.value),
          })}
        />
        {errors.password ? (
          <FieldError id="signup-password-error" message={errors.password.message} />
        ) : (
          <div id="signup-password-strength" className="mt-1">
            <PasswordStrengthMeter password={passwordValue ?? ""} strength={passwordStrength} />
            {!passwordValue && (
              <p className="mt-1 text-xs text-[#7A889D]">
                Use at least 8 characters with uppercase, lowercase, numbers, and symbols.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── College + Field of study ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signup-college" className="text-sm font-medium text-[#3E5375]">
            College <span aria-hidden="true" className="text-red-500">*</span>
            <span className="sr-only">(required)</span>
          </Label>
          <Input
            id="signup-college"
            autoComplete="organization"
            placeholder="Tribhuvan University"
            aria-required="true"
            aria-invalid={Boolean(errors.college)}
            aria-describedby={errors.college ? "signup-college-error" : undefined}
            className="min-h-12 border-[#CBD9EC] bg-[#F7F9FC]/50 text-base shadow-sm placeholder:text-[#9DB7DD] focus-visible:ring-[#0B3D91]"
            {...register("college")}
          />
          <FieldError id="signup-college-error" message={errors.college?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-field" className="text-sm font-medium text-[#3E5375]">
            Field <span aria-hidden="true" className="text-red-500">*</span>
            <span className="sr-only">(required)</span>
          </Label>
          <Input
            id="signup-field"
            placeholder="Computer Science"
            aria-required="true"
            aria-invalid={Boolean(errors.field)}
            aria-describedby={errors.field ? "signup-field-error" : undefined}
            className="min-h-12 border-[#CBD9EC] bg-[#F7F9FC]/50 text-base shadow-sm placeholder:text-[#9DB7DD] focus-visible:ring-[#0B3D91]"
            {...register("field")}
          />
          <FieldError id="signup-field-error" message={errors.field?.message} />
        </div>
      </div>

      {/* ── Submit ── */}
      <Button
        type="submit"
        className="mt-3 min-h-12 w-full bg-[#0B3D91] text-base font-semibold text-white shadow-md transition-all hover:bg-[#08275F] active:scale-[0.98]"
        disabled={isSubmitting}
        aria-disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            <span aria-live="polite">Creating account…</span>
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="pt-2 text-center text-sm font-medium text-[#687A95]">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-bold text-[#0B3D91] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3D91] focus-visible:ring-offset-2 rounded"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
