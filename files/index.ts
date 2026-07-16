// ─── Auth Feature — Public API ────────────────────────────────────────────────
// Export only what consumers outside this feature need.
// Internal utilities, schemas, and hooks are intentionally NOT all exported
// here — consumers should import from the feature's public surface, not
// directly from internal modules (avoids tight coupling).

// Components
export { LoginForm }           from "./components/LoginForm";
export { SignupForm }          from "./components/SignupForm";
export { ProtectedRoute }      from "./components/ProtectedRoute";
export { AuthLayout }          from "./components/AuthLayout";
export { PasswordStrengthMeter } from "./components/PasswordStrengthMeter";
export { PasswordInput }       from "./components/PasswordInput";
export { FormAlert }           from "./components/FormAlert";
export { FieldError }          from "./components/FieldError";

// Hooks
export { useAuth }             from "./hooks/useAuth";

// Services (for use in non-form contexts, e.g. a logout button)
export { logout, getSession }  from "./services/authService";

// Types
export type {
  LoginFormValues,
  SignupFormValues,
  AuthResult,
  PasswordStrength,
  PasswordStrengthLevel,
  SignupMetadata,
}                              from "./types/auth.types";
