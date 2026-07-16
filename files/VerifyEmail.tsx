// ─── VerifyEmail Page (NEW) ───────────────────────────────────────────────────
// Shown immediately after a successful signup.
// Purpose: avoid sending unverified users into the authenticated app.
//
// Flow:
//  1. User completes signup → navigate("/auth/verify-email")
//  2. This page explains they need to check their email.
//  3. They click the link in the email → Supabase redirects to /auth/verified
//     (configured via emailRedirectTo in authService).
//  4. /auth/verified confirms the session and redirects to /feed.
//
// The "Resend email" button is a courtesy feature; Supabase's own rate limiting
// prevents abuse. We give the user a clear countdown before re-enabling.

import { useState, useEffect, useCallback } from "react";
import { Link }         from "react-router-dom";
import { MailCheck }    from "lucide-react";
import { toast }        from "sonner";

import { Button }              from "@/components/ui/button";
import { Card, CardContent }   from "@/components/ui/card";
import { supabase }            from "@/integrations/supabase/client";
import { mapAuthError }        from "@/features/auth/utils/authErrorMapper";

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  // ── Cooldown timer ──
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // ── Resend handler ──
  const handleResend = useCallback(async () => {
    if (resending || cooldown > 0) return;
    setResending(true);

    try {
      // Get the email from the pending session (user may not be verified yet)
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email;

      if (!email) {
        toast.error("We could not find your email address. Please sign up again.");
        return;
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        toast.error(mapAuthError(error, "general"));
        return;
      }

      toast.success("Verification email resent — check your inbox.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      toast.error(mapAuthError(err, "general"));
    } finally {
      setResending(false);
    }
  }, [resending, cooldown]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-6 pt-8 pb-8 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10">
            <MailCheck className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-muted-foreground">
              We've sent you a verification link. Click it to activate your account —
              it may take a minute to arrive.
            </p>
          </div>

          <div className="w-full space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              aria-busy={resending}
            >
              {resending
                ? "Sending…"
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend verification email"}
            </Button>

            <p className="text-sm text-muted-foreground">
              Already verified?{" "}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
