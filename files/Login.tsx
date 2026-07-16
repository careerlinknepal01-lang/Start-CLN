// ─── Login Page (MODIFIED) ────────────────────────────────────────────────────
// This page is now a thin orchestration layer.
// All form logic → useLoginForm hook.
// All auth calls → authService.
// All UI → LoginForm + AuthLayout components.
//
// The page itself holds zero state and no business logic.
// This makes it trivial to test, replace, or wrap with a different layout.

import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { LoginForm }  from "@/features/auth/components/LoginForm";

const Login = () => (
  <AuthLayout
    heading="Welcome back."
    tagline="Pick up where you left off — your network is waiting."
    footnote="Built for undergraduate students across Nepal."
  >
    <LoginForm />
  </AuthLayout>
);

export default Login;
