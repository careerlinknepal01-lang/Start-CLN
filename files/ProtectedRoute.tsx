// ─── ProtectedRoute ───────────────────────────────────────────────────────────
// Route guard that ensures only authenticated users can access children.
//
// Behaviour:
//  1. While session is loading → show a full-screen loading state (prevents
//     flash of the protected content or premature redirect).
//  2. Not authenticated → redirect to /login, preserving the intended
//     destination in router state so LoginForm can redirect back after login.
//  3. Authenticated → render children.
//
// SECURITY:
//  • Session check uses Supabase's getSession() which validates the JWT
//    signature and expiry server-side on the next API call.
//  • We do NOT trust localStorage state alone — the useAuth hook uses
//    onAuthStateChange which Supabase populates after validating the token.
//
// Usage:
//   <Route element={<ProtectedRoute />}>
//     <Route path="/feed" element={<Feed />} />
//   </Route>

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute() {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
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
    // Preserve the attempted path so we can redirect back post-login
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return <Outlet />;
}
