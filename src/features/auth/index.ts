export { LoginForm } from "./components/LoginForm";
export { SignupForm } from "./components/SignupForm";
export { ProtectedRoute } from "./components/ProtectedRoute";
export { AuthLayout } from "./components/AuthLayout";
export { PasswordStrengthMeter } from "./components/PasswordStrengthMeter";
export { PasswordInput } from "./components/PasswordInput";
export { FormAlert } from "./components/FormAlert";
export { FieldError } from "./components/FieldError";

export { useAuth, AuthProvider } from "@/hooks/useAuth";

export { logout, getSession, getSafeRedirectPath, isEmailVerified } from "./services/authService";

export type {
  LoginFormValues,
  SignupFormValues,
  AuthResult,
  PasswordStrength,
  PasswordStrengthLevel,
  SignupMetadata,
} from "./types/auth.types";
