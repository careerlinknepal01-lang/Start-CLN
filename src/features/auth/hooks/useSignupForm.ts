import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { signupSchema, type SignupSchemaValues } from "../schemas/auth.schemas";
import { logout, signupWithEmail } from "../services/authService";
import { scorePassword } from "../utils/passwordStrength";
import type { PasswordStrength } from "../types/auth.types";
import { PENDING_VERIFICATION_EMAIL_KEY } from "../types/auth.types";

export function useSignupForm() {
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "Very weak",
    color: "bg-destructive",
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const form = useForm<SignupSchemaValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", college: "", field: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const handlePasswordChange = (value: string) => {
    form.setValue("password", value, { shouldValidate: form.formState.isSubmitted });
    setPasswordStrength(scorePassword(value));
  };

  const onSubmit = async (values: SignupSchemaValues) => {
    if (isSubmitting) return;

    if (!mountedRef.current) return;
    setFormError(null);
    setIsSubmitting(true);

    try {
      const result = await signupWithEmail(values);

      if (!result.success) {
        if (mountedRef.current) {
          setFormError(result.message);
        }
        toast.error(result.message);
        return;
      }

      if (result.requiresEmailVerification) {
        sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, values.email);
        if (result.session) {
          await logout();
        }
        toast.success("Account created — check your email to verify your address.");
        navigate("/auth/verify-email", { replace: true, state: { email: values.email } });
        return;
      }

      sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
      toast.success("Account created successfully.");
      navigate("/feed", { replace: true });
    } finally {
      if (mountedRef.current) setIsSubmitting(false);
    }
  };

  return {
    form,
    formError,
    isSubmitting,
    passwordStrength,
    handlePasswordChange,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
