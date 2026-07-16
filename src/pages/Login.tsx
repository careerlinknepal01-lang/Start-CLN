import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { GuestRoute } from "@/features/auth/components/GuestRoute";

const Login = () => (
  <GuestRoute>
    <AuthLayout
      heading="Welcome back."
      tagline="Pick up where you left off — your network is waiting."
      footnote="Built for undergraduate students across Nepal."
    >
      <LoginForm />
    </AuthLayout>
  </GuestRoute>
);

export default Login;
