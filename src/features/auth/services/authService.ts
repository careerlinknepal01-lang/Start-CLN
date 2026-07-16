import { supabase } from "@/integrations/supabase/client";
import type { LoginSchemaValues, SignupSchemaValues } from "../schemas/auth.schemas";
import { mapAuthError } from "../utils/authErrorMapper";
import type { AuthResult } from "../types/auth.types";

const EMAIL_REDIRECT_PATH = "/auth/verified";

export function isEmailVerified(emailConfirmedAt: string | undefined | null): boolean {
  return Boolean(emailConfirmedAt);
}

export async function loginWithEmail(values: LoginSchemaValues): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      return { success: false, message: mapAuthError(error, "login") };
    }

    if (data.session && !isEmailVerified(data.session.user.email_confirmed_at)) {
      await supabase.auth.signOut();
      return {
        success: false,
        message:
          "Please verify your email before signing in. Check your inbox for the verification link.",
      };
    }

    return { success: true, session: data.session };
  } catch (err) {
    return { success: false, message: mapAuthError(err, "login") };
  }
}

export async function signupWithEmail(values: SignupSchemaValues): Promise<AuthResult> {
  try {
    const metadata = {
      name: values.name.slice(0, 100),
      college: values.college.slice(0, 150),
      field: values.field.slice(0, 100),
    };

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}${EMAIL_REDIRECT_PATH}`,
        data: metadata,
      },
    });

    if (error) {
      return { success: false, message: mapAuthError(error, "signup") };
    }

    const session = data.session;
    const verified = isEmailVerified(data.user?.email_confirmed_at);

    return {
      success: true,
      session,
      requiresEmailVerification: !session || !verified,
    };
  } catch (err) {
    return { success: false, message: mapAuthError(err, "signup") };
  }
}

export async function resendVerificationEmail(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
    });

    if (error) {
      return { success: false, message: mapAuthError(error, "general") };
    }

    return { success: true };
  } catch (err) {
    return { success: false, message: mapAuthError(err, "general") };
  }
}

export async function logout(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, message: mapAuthError(error, "general") };
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: mapAuthError(err, "general") };
  }
}

export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      mapAuthError(error, "general");
      return null;
    }
    return data.session;
  } catch (err) {
    mapAuthError(err, "general");
    return null;
  }
}

export function getSafeRedirectPath(from: unknown): string {
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//")) {
    return "/feed";
  }
  if (from.startsWith("/login") || from.startsWith("/signup") || from.startsWith("/auth/")) {
    return "/feed";
  }
  return from;
}
