type AuthErrorContext = "login" | "signup" | "general";

export function mapAuthError(error: unknown, context: AuthErrorContext = "general"): string {
  if (import.meta.env.DEV) {
    console.error(`[auth:${context}]`, error);
  }

  const message = extractMessage(error);

  if (
    matchesAny(message, [
      "user already registered",
      "email already in use",
      "email already exists",
      "duplicate",
    ])
  ) {
    return context === "signup"
      ? "If this email is not already registered, you will receive a verification link shortly."
      : genericLoginError();
  }

  if (
    matchesAny(message, [
      "invalid login credentials",
      "invalid credentials",
      "wrong password",
      "incorrect password",
      "invalid email or password",
      "email not confirmed",
      "email_not_confirmed",
    ])
  ) {
    return genericLoginError();
  }

  if (
    matchesAny(message, [
      "too many requests",
      "rate limit",
      "over_email_send_rate_limit",
      "email rate limit exceeded",
    ])
  ) {
    return "Too many attempts. Please wait a few minutes before trying again.";
  }

  if (matchesAny(message, ["invalid email", "email is invalid", "unable to validate email"])) {
    return "Enter a valid email address.";
  }

  if (matchesAny(message, ["password", "weak password", "password should be"])) {
    return "Your password does not meet the security requirements. Please choose a stronger password.";
  }

  if (
    matchesAny(message, [
      "networkerror",
      "failed to fetch",
      "network request failed",
      "load failed",
      "offline",
    ])
  ) {
    return context === "signup"
      ? "Could not create your account. Check your connection and try again."
      : "Could not sign in. Check your connection and try again.";
  }

  if (
    matchesAny(message, [
      "refresh token",
      "token expired",
      "jwt expired",
      "session expired",
      "invalid jwt",
    ])
  ) {
    return "Your session has expired. Please sign in again.";
  }

  return context === "signup"
    ? "Could not create your account. Please try again later."
    : context === "login"
      ? genericLoginError()
      : "Something went wrong. Please try again.";
}

function extractMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error.toLowerCase();
  if (error instanceof Error) return error.message.toLowerCase();
  if (
    typeof error === "object" &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  ) {
    return ((error as Record<string, unknown>).message as string).toLowerCase();
  }
  return "";
}

function matchesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function genericLoginError(): string {
  return "The email or password is incorrect. Please try again.";
}
