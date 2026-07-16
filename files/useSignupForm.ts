// ─── useSignupForm Hook ───────────────────────────────────────────────────────
// Encapsulates signup form state, validation, submission, and navigation.
//
// IMPORTANT — Email Verification Flow:
//  After a successful Supabase signUp(), the user receives a verification email.
//  We do NOT navigate to /feed immediately because:
//   1. The user is not yet verified — Supabase won't allow them access to
//      protected resources until they confirm their email.
//   2. Sending an unverified user into the app causes confusing partial states.
//
//  Instead we navigate to /auth/verify-email which shows a friendly
//  "check your inbox" screen. Once they click the link in the email,
//  Supabase redirects them to /auth/verified (handled by VerifiedPage).

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { signupSchema, type SignupSchemaValues } from "../schemas/auth.schemas";
import { signupWithEmail } from "../services/authService";
import { scorePassword } from "../utils/passwordStrength";
import type { PasswordStrength } from "../types/auth.types";

export function useSignupForm() {
  const navigate = useNavigate();

  const [formError, setFormError]       = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "Very weak",
    color: "bg-destructive",
  });

  const form = useForm<SignupSchemaValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", college: "", field: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  // Update strength meter whenever the password field changes.
  // We do this outside Zod so we get live feedback before blur.
  const handlePasswordChange = (value: string) => {
    form.setValue("password", value, { shouldValidate: form.formState.isSubmitted });
    setPasswordStrength(scorePassword(value));
  };

  const onSubmit = async (values: SignupSchemaValues) => {
    if (isSubmitting) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const result = await signupWithEmail(values);

      if (!result.success) {
        // SECURITY: mapAuthError in authService ensures `result.message` is
        // always a generic, enumeration-safe string — not the raw Supabase error.
        setFormError(result.message);
        toast.error(result.message);
        return;
      }

      // Do NOT redirect to /feed. Navigate to the verify-email holding page.
      toast.success("Account created — check your email to verify your address.");
      navigate("/auth/verify-email", { replace: true });
    } finally {
      setIsSubmitting(false);
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
