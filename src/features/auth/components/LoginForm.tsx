import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    <form onSubmit={onSubmit} className="space-y-5" aria-label="Sign in form">
      <FormAlert message={formError} severity="error" />

      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-sm font-medium text-[#3E5375]">
          Email <span aria-hidden="true" className="text-red-500">*</span>
          <span className="sr-only">(required)</span>
        </Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-required="true"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className="min-h-12 border-[#CBD9EC] bg-[#F7F9FC]/50 text-base shadow-sm placeholder:text-[#9DB7DD] focus-visible:ring-[#0B3D91]"
          placeholder="you@example.com"
          {...register("email")}
        />
        <FieldError id="login-email-error" message={errors.email?.message} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password" className="text-sm font-medium text-[#3E5375]">
            Password <span aria-hidden="true" className="text-red-500">*</span>
            <span className="sr-only">(required)</span>
          </Label>
          <Link to="/forgot-password" className="text-xs font-semibold text-[#0B3D91] hover:underline" tabIndex={-1}>
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          aria-required="true"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          className="min-h-12 border-[#CBD9EC] bg-[#F7F9FC]/50 text-base shadow-sm focus-visible:ring-[#0B3D91]"
          {...register("password")}
        />
        <FieldError id="login-password-error" message={errors.password?.message} />
      </div>

      <Button
        type="submit"
        className="mt-2 min-h-12 w-full bg-[#0B3D91] text-base font-semibold text-white shadow-md transition-all hover:bg-[#08275F] active:scale-[0.98]"
        disabled={isSubmitting}
        aria-disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            <span aria-live="polite">Signing in…</span>
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="pt-2 text-center text-sm font-medium text-[#687A95]">
        No account?{" "}
        <Link
          to="/signup"
          className="font-bold text-[#0B3D91] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3D91] focus-visible:ring-offset-2 rounded"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
