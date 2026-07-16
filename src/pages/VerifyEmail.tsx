import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resendVerificationEmail } from "@/features/auth/services/authService";
import { PENDING_VERIFICATION_EMAIL_KEY } from "@/features/auth/types/auth.types";

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
  const location = useLocation();
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const emailFromState = (location.state as { email?: string } | null)?.email;
  const pendingEmail =
    emailFromState ?? sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY) ?? undefined;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (resending || cooldown > 0) return;

    if (!pendingEmail) {
      toast.error("We could not find your email address. Please sign up again.");
      return;
    }

    setResending(true);

    try {
      const result = await resendVerificationEmail(pendingEmail);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Verification email resent — check your inbox.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResending(false);
    }
  }, [resending, cooldown, pendingEmail]);

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
              We've sent you a verification link
              {pendingEmail ? (
                <>
                  {" "}
                  to <span className="font-medium text-foreground">{pendingEmail}</span>
                </>
              ) : null}
              . Click it to activate your account — it may take a minute to arrive.
            </p>
          </div>

          <div className="w-full space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !pendingEmail}
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
