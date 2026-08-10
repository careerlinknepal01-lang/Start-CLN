import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "../hooks/useAdminAuth";

export function AdminProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { isAdmin, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!authLoading && !isLoading && session && !isAdmin) {
      toast.error("Access Denied", { description: "You need admin privileges to access this page." });
    }
  }, [authLoading, isLoading, session, isAdmin]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status">
        <div className="flex flex-col items-center gap-3">
          <img src="/cln.png" alt="" className="h-10 w-10 object-contain animate-pulse-soft" aria-hidden="true" />
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Verifying admin access…</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/feed" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
