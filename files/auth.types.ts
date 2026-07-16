// ─── Auth Types ──────────────────────────────────────────────────────────────
// Central type definitions for the entire auth feature.
// Keeping types co-located with the feature avoids circular imports and makes
// the feature self-contained.

export type LoginFormValues = {
  email: string;
  password: string;
};

export type SignupFormValues = {
  name: string;
  email: string;
  password: string;
  college: string;
  field: string;
};

/**
 * Severity levels map to different UI treatments.
 * "error"   → destructive banner, blocks submission
 * "warning" → yellow advisory (e.g. unverified email)
 * "info"    → neutral guidance
 */
export type AuthMessageSeverity = "error" | "warning" | "info";

export type AuthMessage = {
  severity: AuthMessageSeverity;
  text: string;
};

/**
 * Represents the result of any auth service call.
 * Using a discriminated union means callers must handle both branches.
 */
export type AuthResult =
  | { success: true }
  | { success: false; message: string };

/**
 * Password strength levels, ordered 0 → 4 (weakest → strongest).
 * Matches the zxcvbn-style 0–4 scale so we can swap in zxcvbn later.
 */
export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4;

export type PasswordStrength = {
  score: PasswordStrengthLevel;
  label: string;
  color: string; // Tailwind color token
};

/**
 * Metadata stored in Supabase auth.users.raw_user_meta_data at signup.
 * Typed separately so it can be validated before persistence.
 */
export type SignupMetadata = {
  name: string;
  college: string;
  field: string;
};
