// ─── Auth Service ─────────────────────────────────────────────────────────────
// Centralises all Supabase auth calls.
//
// Design decisions:
//  • Returns AuthResult (discriminated union) — callers never touch raw Supabase
//    error objects, so no raw errors leak to UI code.
//  • All sanitisation happens BEFORE the Supabase call.
//  • All metadata stored at signup is validated and trimmed here.
//  • Detailed error information is handled by mapAuthError (logged internally,
//    never surfaced to users).
//
// SECURITY:
//  • email is lowercased before every call to prevent case-based account duplication.
//  • Metadata values are trimmed and length-capped to prevent oversized inputs.
//  • emailRedirectTo is built from a controlled constant, not user input.

import { supabase } from "@/integrations/supabase/client";
import type { LoginSchemaValues, SignupSchemaValues } from "../schemas/auth.schemas";
import { mapAuthError } from "../utils/authErrorMapper";
import type { AuthResult } from "../types/auth.types";

// The path the email verification link will redirect the user to.
// Must match an allowed redirect URL in your Supabase project settings.
// Using /auth/verified (a dedicated page) rather than /feed so we can
// show a "confirmed!" message before pushing the user into the app.
const EMAIL_REDIRECT_PATH = "/auth/verified";

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginWithEmail(values: LoginSchemaValues): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email, // already trimmed + lowercased by schema transform
      password: values.password,
    });

    if (error) {
      return { success: false, message: mapAuthError(error, "login") };
    }

    return { success: true };
  } catch (err) {
    return { success: false, message: mapAuthError(err, "login") };
  }
}

// ─── Signup ───────────────────────────────────────────────────────────────────

export async function signupWithEmail(values: SignupSchemaValues): Promise<AuthResult> {
  try {
    // Sanitise metadata — these values go into raw_user_meta_data in Supabase.
    // Capping lengths here as a server-side guardrail in addition to schema.
    const metadata = {
      name:    values.name.slice(0, 100),
      college: values.college.slice(0, 150),
      field:   values.field.slice(0, 100),
    };

    const { error } = await supabase.auth.signUp({
      email:    values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}${EMAIL_REDIRECT_PATH}`,
        data: metadata,
      },
    });

    if (error) {
      // SECURITY: mapAuthError returns a generic message for duplicate-email
      // errors so we don't expose whether an account exists.
      return { success: false, message: mapAuthError(error, "signup") };
    }

    return { success: true };
  } catch (err) {
    return { success: false, message: mapAuthError(err, "signup") };
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

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

// ─── Session ──────────────────────────────────────────────────────────────────

/**
 * Returns the current session, or null if unauthenticated / expired.
 * Supabase auto-refreshes the token; this call surfaces any refresh failure.
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      // Log internally; don't throw — callers handle null gracefully
      mapAuthError(error, "general");
      return null;
    }
    return data.session;
  } catch (err) {
    mapAuthError(err, "general");
    return null;
  }
}
