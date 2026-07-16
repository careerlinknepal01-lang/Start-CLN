// ─── useLoginForm Hook ────────────────────────────────────────────────────────
// Encapsulates all login form logic so the LoginForm component is purely
// presentational and has minimal business logic.
//
// Responsibilities:
//  • react-hook-form setup with Zod validation
//  • Calling the auth service
//  • Brute-force throttle checks
//  • Success/error handling (toast + form error)
//  • Navigation after success
//  • Preserving the intended destination (redirect after login)

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { loginSchema, type LoginSchemaValues } from "../schemas/auth.schemas";
import { loginWithEmail } from "../services/authService";
import {
  checkThrottle,
  recordFailedAttempt,
  clearAttempts,
  formatLockoutTime,
  getRemainingAttempts,
} from "../utils/loginThrottle";

const DEFAULT_REDIRECT = "/feed";

export function useLoginForm() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Preserve the page the user was trying to reach before being redirected
  // to login. We read it from router state (set by ProtectedRoute).
  const intendedDestination =
    (location.state as { from?: string } | null)?.from ?? DEFAULT_REDIRECT;

  const [formError, setFormError]       = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginSchemaValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",      // validate on blur for immediate field feedback
    reValidateMode: "onChange", // re-validate on change after first submission
  });

  const onSubmit = async (values: LoginSchemaValues) => {
    if (isSubmitting) return;

    setFormError(null);

    // ── Throttle check ────────────────────────────────────────────────────────
    const throttle = checkThrottle(values.email);
    if (throttle.throttled) {
      const msg = `Too many failed attempts. Please wait ${formatLockoutTime(throttle.remainingMs)} before trying again.`;
      setFormError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginWithEmail(values);

      if (!result.success) {
        // Record the failure for throttling
        recordFailedAttempt(values.email);

        const remaining = getRemainingAttempts(values.email);
        const warningNote =
          remaining > 0 && remaining <= 2
            ? ` You have ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining before a temporary lockout.`
            : "";

        const message = result.message + warningNote;
        setFormError(message);
        toast.error(result.message); // toast without the warning note (cleaner)
        return;
      }

      // Success — clear throttle record and navigate
      clearAttempts(values.email);
      toast.success("Welcome back");
      navigate(intendedDestination, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    formError,
    isSubmitting,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
