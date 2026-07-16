// ─── App Router (MODIFIED) ────────────────────────────────────────────────────
// Changes from original:
//  1. ProtectedRoute wrapper guards all authenticated pages.
//  2. New routes: /auth/verify-email and /auth/verified.
//  3. Lazy loading on all page-level components to improve initial bundle size.
//  4. The /feed route (and any future protected routes) are nested under
//     ProtectedRoute so they can't be accessed without a valid session.
//
// NOTE: Adjust the existing imports to match your actual file paths.
// This file assumes the standard Lovable / Vite + React Router v6 structure.

import { Suspense, lazy }       from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 }              from "lucide-react";
import { Toaster }              from "sonner";

import { ProtectedRoute }       from "@/features/auth/components/ProtectedRoute";

// ── Lazy-loaded pages ──────────────────────────────────────────────────────────
const Login        = lazy(() => import("@/pages/Login"));
const Signup       = lazy(() => import("@/pages/Signup"));
const VerifyEmail  = lazy(() => import("@/pages/VerifyEmail"));
const EmailVerified = lazy(() => import("@/pages/EmailVerified"));

// Replace these with your actual page imports
const Feed         = lazy(() => import("@/pages/Feed"));         // existing
const Index        = lazy(() => import("@/pages/Index"));        // existing landing page
const NotFound     = lazy(() => import("@/pages/NotFound"));     // existing 404

// ── Page loading fallback ──────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      role="status"
      aria-label="Loading page…"
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      {/*
        Toaster config:
        - position "top-center" is most accessible (visible without scrolling)
        - richColors for visual differentiation of success/error
        - duration 5000ms gives users time to read
        - We limit to 3 visible toasts to prevent stacking
      */}
      <Toaster
        position="top-center"
        richColors
        duration={5000}
        visibleToasts={3}
        closeButton
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/"            element={<Index />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/signup"      element={<Signup />} />

          {/* ── Email verification flow (public — user may not be authenticated yet) ── */}
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/verified"     element={<EmailVerified />} />

          {/* ── Protected routes ── */}
          {/*
            All routes nested here are guarded by ProtectedRoute.
            Unauthenticated users are redirected to /login with the intended
            destination preserved in router state.
          */}
          <Route element={<ProtectedRoute />}>
            <Route path="/feed" element={<Feed />} />
            {/* Add future protected routes here: */}
            {/* <Route path="/profile" element={<Profile />} /> */}
            {/* <Route path="/settings" element={<Settings />} /> */}
          </Route>

          {/* ── Fallback ── */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*"    element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
