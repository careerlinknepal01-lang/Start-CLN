import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getSafeRedirectPath, isEmailVerified } from "@/features/auth/services/authService";
import { Loader2 } from "lucide-react";

type GuestRouteProps = {
  children: React.ReactNode;
};

export function GuestRoute({ children }: GuestRouteProps) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !session) return;

    if (isEmailVerified(session.user.email_confirmed_at)) {
      navigate(getSafeRedirectPath("/feed"), { replace: true });
    }
  }, [session, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (session && isEmailVerified(session.user.email_confirmed_at)) {
    return null;
  }

  return children;
}
