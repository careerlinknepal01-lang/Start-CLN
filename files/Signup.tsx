// ─── Signup Page (MODIFIED) ───────────────────────────────────────────────────
// Thin orchestration layer — no state, no logic.
// All form logic → useSignupForm hook.
// All auth calls → authService.
// All UI → SignupForm + AuthLayout.

import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { SignupForm } from "@/features/auth/components/SignupForm";

const Signup = () => (
  <AuthLayout 
    heading="Join your community."
    tagline="Create a profile, find peers, and take part in career-building conversations."
    footnote="Free for undergraduate students across Nepal."
  >
    <SignupForm />
  </AuthLayout>
);

export default Signup;
