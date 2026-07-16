import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { loginSchema, type LoginSchemaValues } from "../schemas/auth.schemas";
import { getSafeRedirectPath, loginWithEmail } from "../services/authService";
import {
  checkThrottle,
  recordFailedAttempt,
  clearAttempts,
  formatLockoutTime,
  getRemainingAttempts,
} from "../utils/loginThrottle";
import { PENDING_VERIFICATION_EMAIL_KEY } from "../types/auth.types";

export function useLoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const mountedRef = useRef(true);

  const intendedDestination = getSafeRedirectPath(
    (location.state as { from?: string } | null)?.from
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const form = useForm<LoginSchemaValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const onSubmit = async (values: LoginSchemaValues) => {
    if (isSubmitting) return;

    if (!mountedRef.current) return;
    setFormError(null);

    const throttle = checkThrottle(values.email);
    if (throttle.throttled) {
      const msg = `Too many failed attempts. Please wait ${formatLockoutTime(throttle.remainingMs)} before trying again.`;
      if (mountedRef.current) setFormError(msg);
      toast.error(msg);
      return;
    }

    if (mountedRef.current) setIsSubmitting(true);

    try {
      const result = await loginWithEmail(values);

      if (!result.success) {
        recordFailedAttempt(values.email);

        const remaining = getRemainingAttempts(values.email);
        const warningNote =
          remaining > 0 && remaining <= 2
            ? ` You have ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining before a temporary lockout.`
            : "";

        if (mountedRef.current) {
          setFormError(result.message + warningNote);
        }
        toast.error(result.message);
        return;
      }

      clearAttempts(values.email);
      sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
      toast.success("Welcome back");
      navigate(intendedDestination, { replace: true });
    } finally {
      if (mountedRef.current) setIsSubmitting(false);
    }
  };

  return {
    form,
    formError,
    isSubmitting,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
