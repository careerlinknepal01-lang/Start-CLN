// ─── EmailVerified Page (NEW) ─────────────────────────────────────────────────
// Landing page after the user clicks the verification link in their email.
//
// Supabase's magic-link / email confirmation flow:
//  1. User clicks link → browser hits this page with hash params
//     e.g. /#access_token=...&type=signup
//  2. Supabase JS SDK (initialised in client.ts) detects the hash, exchanges
//     it for a session, and fires onAuthStateChange("SIGNED_IN").
//  3. This page waits for that event, then confirms success and navigates
//     to /feed.
//
// We listen to onAuthStateChange rather than parsing the hash manually so that:
//  • We don't handle tokens directly (security).
//  • We correctly handle both first-time verification and re-verification.
//  • The SDK manages all token storage.

import { useEffect, useState } from "react";
import { useNavigate }         from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { Button }            from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase }          from "@/integrations/supabase/client";

type VerificationStatus = "loading" | "success" | "error";

const EmailVerified = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>("loading");

  useEffect(() => {
    let mounted = true;

    // Supabase processes the URL hash on load; listen for the resulting event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" && session) {
        setStatus("success");
        // Brief delay so user sees the success state before redirect
        setTimeout(() => navigate("/feed", { replace: true }), 2000);
      } else if (event === "USER_UPDATED" && session) {
        // Re-verification flow
        setStatus("success");
        setTimeout(() => navigate("/feed", { replace: true }), 2000);
      }
    });

    // Fallback: if session already exists when this page loads (e.g. back button)
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        setStatus("success");
        setTimeout(() => navigate("/feed", { replace: true }), 2000);
      } else {
        // Give the SDK time to process the hash; if no session after 5s → error
        setTimeout(() => {
          if (mounted) setStatus((s) => (s === "loading" ? "error" : s));
        }, 5000);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-6 pt-8 pb-8 text-center">
          {status === "loading" && (
            <>
              <Loader2
                className="h-12 w-12 animate-spin text-primary"
                aria-hidden="true"
              />
              <div role="status" aria-live="polite">
                <h1 className="text-2xl font-bold">Verifying your email…</h1>
                <p className="mt-2 text-muted-foreground">Just a moment.</p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden="true" />
              </div>
              <div role="status" aria-live="polite">
                <h1 className="text-2xl font-bold">Email verified!</h1>
                <p className="mt-2 text-muted-foreground">
                  You're all set. Taking you to your feed…
                </p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="grid h-16 w-16 place-items-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
              </div>
              <div role="alert">
                <h1 className="text-2xl font-bold">Verification failed</h1>
                <p className="mt-2 text-muted-foreground">
                  The link may have expired or already been used.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => navigate("/auth/verify-email", { replace: true })}
                className="w-full"
              >
                Request a new link
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerified;
