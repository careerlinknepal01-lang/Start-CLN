// ─── Auth Validation Schemas ──────────────────────────────────────────────────
// All form validation lives here so it is reusable, testable in isolation, and
// kept out of page/component code.
//
// We use Zod because it:
//  • produces TypeScript-inferred types automatically
//  • supports .transform() for normalisation (trim, lowercase)
//  • has excellent error message customisation
//  • integrates with react-hook-form via @hookform/resolvers/zod

import { z } from "zod";

// ─── Reusable field rules ─────────────────────────────────────────────────────

/**
 * RFC 5322-inspired email validation.
 * The built-in z.string().email() uses a regex that covers the vast majority
 * of real-world addresses while rejecting obvious garbage.
 * We additionally normalise to lowercase so "User@EXAMPLE.COM" and
 * "user@example.com" are treated identically.
 */
const emailField = z
  .string()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .transform((v) => v.trim().toLowerCase());

/**
 * Password rules:
 *  - At least 8 characters (NIST baseline)
 *  - At least one uppercase letter
 *  - At least one lowercase letter
 *  - At least one digit
 *  - At least one special character
 *
 * These rules are intentionally configurable via PASSWORD_POLICY so they can
 * be tightened without touching schemas.
 */
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true,
} as const;

const passwordField = z
  .string()
  .min(1, "Password is required.")
  .min(PASSWORD_POLICY.minLength, `Use at least ${PASSWORD_POLICY.minLength} characters.`)
  .refine(
    (v) => !PASSWORD_POLICY.requireUppercase || /[A-Z]/.test(v),
    "Include at least one uppercase letter."
  )
  .refine(
    (v) => !PASSWORD_POLICY.requireLowercase || /[a-z]/.test(v),
    "Include at least one lowercase letter."
  )
  .refine(
    (v) => !PASSWORD_POLICY.requireDigit || /[0-9]/.test(v),
    "Include at least one number."
  )
  .refine(
    (v) => !PASSWORD_POLICY.requireSpecial || /[^A-Za-z0-9]/.test(v),
    "Include at least one special character (e.g. ! @ # $)."
  );

/**
 * Name: required, 2–100 chars, trimmed, no leading/trailing spaces passing.
 * We don't restrict characters to avoid excluding names with hyphens, accents,
 * or Devanagari script (relevant for a Nepal-focused product).
 */
const nameField = z
  .string()
  .min(1, "Full name is required.")
  .transform((v) => v.trim())
  .pipe(z.string().min(2, "Name must be at least 2 characters.").max(100, "Name must be under 100 characters."));

/**
 * College / institution: required, 2–150 chars, trimmed.
 */
const collegeField = z
  .string()
  .min(1, "College is required.")
  .transform((v) => v.trim())
  .pipe(
    z.string().min(2, "College name must be at least 2 characters.").max(150, "College name must be under 150 characters.")
  );

/**
 * Field of study: required, 2–100 chars, trimmed.
 */
const fieldOfStudyField = z
  .string()
  .min(1, "Field of study is required.")
  .transform((v) => v.trim())
  .pipe(
    z.string().min(2, "Field of study must be at least 2 characters.").max(100, "Field of study must be under 100 characters.")
  );

// ─── Form schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required."),
  // NOTE: We intentionally do NOT apply full password-strength rules on login.
  // If a user was created before stricter rules were introduced, they must
  // still be able to sign in. Strength rules only apply at signup.
});

export const signupSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  college: collegeField,
  field: fieldOfStudyField,
});

// ─── Inferred types (single source of truth) ──────────────────────────────────
export type LoginSchemaValues = z.infer<typeof loginSchema>;
export type SignupSchemaValues = z.infer<typeof signupSchema>;
