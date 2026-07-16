import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { SignupForm } from "@/features/auth/components/SignupForm";
import { GuestRoute } from "@/features/auth/components/GuestRoute";

const Signup = () => (
  <GuestRoute>
    <AuthLayout
      heading="Join your community."
      tagline="Create a profile, find peers, and take part in career-building conversations."
      footnote="Free for undergraduate students across Nepal."
    >
      <SignupForm />
    </AuthLayout>
  </GuestRoute>
);

export default Signup;
