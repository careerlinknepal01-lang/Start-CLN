// ─── Auth Error Mapper ────────────────────────────────────────────────────────
// SECURITY: Never expose raw Supabase/backend error messages to the user.
//
// Raw errors can reveal:
//  • Whether an email address is registered (account enumeration)
//  • Internal system details (information disclosure)
//  • Stack traces or SQL errors
//
// Strategy:
//  1. Map known Supabase error codes/messages to generic user-facing strings.
//  2. Log the original error internally (but NEVER to the browser console in prod).
//  3. Fall back to a generic "something went wrong" message for unknowns.

type AuthErrorContext = "login" | "signup" | "general";

/**
 * Maps a raw Supabase auth error to a safe, user-facing message.
 *
 * @param error   - The raw Error (or unknown) caught from the auth call.
 * @param context - Which flow produced the error, so we can tailor wording.
 * @returns       - A generic, user-safe error string.
 */
export function mapAuthError(error: unknown, context: AuthErrorContext = "general"): string {
  // ── Internal logging only ──
  // In production replace console.error with your observability pipeline
  // (e.g. Sentry, Datadog). NEVER surface raw `error` to the DOM.
  if (process.env.NODE_ENV !== "production") {
    console.error(`[auth:${context}]`, error);
  } else {
    // Production: send to error tracking service without exposing to user
    // e.g. Sentry.captureException(error, { tags: { authContext: context } });
  }

  const message = extractMessage(error);

  // ── Account enumeration guard ──────────────────────────────────────────────
  // Supabase returns "User already registered" on duplicate signups and
  // "Invalid login credentials" for bad passwords. Both must map to the same
  // generic message so attackers cannot probe which emails exist.
  if (matchesAny(message, [
    "user already registered",
    "email already in use",
    "email already exists",
    "duplicate",
  ])) {
    // Identical message to signup success — don't reveal account existence
    return context === "signup"
      ? "If this email is not already registered, you will receive a verification link shortly."
      : genericLoginError();
  }

  // ── Credential errors ──────────────────────────────────────────────────────
  if (matchesAny(message, [
    "invalid login credentials",
    "invalid credentials",
    "wrong password",
    "incorrect password",
    "invalid email or password",
    "email not confirmed",
    "email_not_confirmed",
  ])) {
    return genericLoginError();
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (matchesAny(message, [
    "too many requests",
    "rate limit",
    "over_email_send_rate_limit",
    "email rate limit exceeded",
  ])) {
    return "Too many attempts. Please wait a few minutes before trying again.";
  }

  // ── Email validation ───────────────────────────────────────────────────────
  if (matchesAny(message, ["invalid email", "email is invalid", "unable to validate email"])) {
    return "Enter a valid email address.";
  }

  // ── Weak password (Supabase-level) ─────────────────────────────────────────
  if (matchesAny(message, ["password", "weak password", "password should be"])) {
    return "Your password does not meet the security requirements. Please choose a stronger password.";
  }

  // ── Network / connectivity ─────────────────────────────────────────────────
  if (matchesAny(message, [
    "networkerror",
    "failed to fetch",
    "network request failed",
    "load failed",
    "offline",
  ])) {
    return context === "signup"
      ? "Could not create your account. Check your connection and try again."
      : "Could not sign in. Check your connection and try again.";
  }

  // ── Session / token errors ─────────────────────────────────────────────────
  if (matchesAny(message, [
    "refresh token",
    "token expired",
    "jwt expired",
    "session expired",
    "invalid jwt",
  ])) {
    return "Your session has expired. Please sign in again.";
  }

  // ── Generic fallback — never leaks internals ───────────────────────────────
  return context === "signup"
    ? "Could not create your account. Please try again later."
    : context === "login"
    ? genericLoginError()
    : "Something went wrong. Please try again.";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error.toLowerCase();
  if (error instanceof Error) return error.message.toLowerCase();
  if (typeof error === "object" && "message" in error && typeof (error as Record<string, unknown>).message === "string") {
    return ((error as Record<string, unknown>).message as string).toLowerCase();
  }
  return "";
}

function matchesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

/**
 * Single authoritative login error message.
 * SECURITY: Same message regardless of whether email OR password is wrong.
 * This prevents account enumeration ("that email doesn't exist" vs
 * "wrong password" tells an attacker which emails are registered).
 */
function genericLoginError(): string {
  return "The email or password is incorrect. Please try again.";
}
