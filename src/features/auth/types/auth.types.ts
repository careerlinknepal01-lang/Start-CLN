import type { Session } from "@supabase/supabase-js";

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

export type AuthMessageSeverity = "error" | "warning" | "info";

export type AuthMessage = {
  severity: AuthMessageSeverity;
  text: string;
};

export type AuthResult =
  | {
      success: true;
      session?: Session | null;
      requiresEmailVerification?: boolean;
    }
  | { success: false; message: string };

export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4;

export type PasswordStrength = {
  score: PasswordStrengthLevel;
  label: string;
  color: string;
};

export type SignupMetadata = {
  name: string;
  college: string;
  field: string;
};

export const PENDING_VERIFICATION_EMAIL_KEY = "cln_pending_verification_email";
