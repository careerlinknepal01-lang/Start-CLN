import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isEmailVerified } from "../services/authService";

type ProtectedRouteProps = {
  children?: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-label="Checking authentication…"
      >
        <Loader2
          className="h-8 w-8 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="sr-only">Loading, please wait…</span>
      </div>
    );
  }

  if (!session) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/login" state={{ from }} replace />;
  }

  if (!isEmailVerified(session.user.email_confirmed_at)) {
    return (
      <Navigate
        to="/auth/verify-email"
        state={{ email: session.user.email }}
        replace
      />
    );
  }

  if (children) {
    return children;
  }

  return <Outlet />;
}
