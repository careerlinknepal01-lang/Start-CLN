// ─── Password Strength Calculator ────────────────────────────────────────────
// A lightweight heuristic scorer (no external dependencies).
// Can be swapped for zxcvbn later without changing the consumer API.
//
// Scores map to the zxcvbn 0–4 scale:
//   0 — Very weak
//   1 — Weak
//   2 — Fair
//   3 — Strong
//   4 — Very strong

import type { PasswordStrength, PasswordStrengthLevel } from "../types/auth.types";

const STRENGTH_META: Record<PasswordStrengthLevel, { label: string; color: string }> = {
  0: { label: "Very weak",   color: "bg-destructive" },
  1: { label: "Weak",        color: "bg-orange-500"  },
  2: { label: "Fair",        color: "bg-yellow-500"  },
  3: { label: "Strong",      color: "bg-emerald-500" },
  4: { label: "Very strong", color: "bg-green-600"   },
};

/**
 * Score a password on 0–4 scale using heuristic checks.
 * Not a replacement for server-side policy enforcement — this is purely UX.
 */
export function scorePassword(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, ...STRENGTH_META[0] };
  }

  let score = 0;

  // Length bonus
  if (password.length >= 8)  score += 1;
  if (password.length >= 12) score += 1;

  // Character class diversity
  const hasUpper   = /[A-Z]/.test(password);
  const hasLower   = /[a-z]/.test(password);
  const hasDigit   = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const classCount = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;

  if (classCount >= 3) score += 1;
  if (classCount === 4) score += 1;

  // Cap at 4
  const capped = Math.min(score, 4) as PasswordStrengthLevel;
  return { score: capped, ...STRENGTH_META[capped] };
}

/**
 * Returns an array of human-readable requirements and whether each is met.
 * Used to render the requirement checklist beneath the password field.
 */
export function getPasswordRequirements(password: string) {
  return [
    { label: "At least 8 characters",            met: password.length >= 8              },
    { label: "One uppercase letter (A–Z)",        met: /[A-Z]/.test(password)            },
    { label: "One lowercase letter (a–z)",        met: /[a-z]/.test(password)            },
    { label: "One number (0–9)",                  met: /[0-9]/.test(password)            },
    { label: "One special character (! @ # $ …)", met: /[^A-Za-z0-9]/.test(password)    },
  ];
}
