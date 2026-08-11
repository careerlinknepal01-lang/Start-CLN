import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PENDING_VERIFICATION_EMAIL_KEY } from "@/features/auth/types/auth.types";

type VerificationStatus = "loading" | "success" | "error";

const EmailVerified = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>("loading");

  useEffect(() => {
    let mounted = true;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;
    let errorTimer: ReturnType<typeof setTimeout> | undefined;

    const completeVerification = () => {
      if (!mounted) return;
      setStatus("success");
      sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
      redirectTimer = setTimeout(() => navigate("/feed", { replace: true }), 2000);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
        completeVerification();
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      if (data.session?.user.email_confirmed_at) {
        completeVerification();
      } else {
        errorTimer = setTimeout(() => {
          if (mounted) setStatus((s) => (s === "loading" ? "error" : s));
        }, 5000);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (redirectTimer) clearTimeout(redirectTimer);
      if (errorTimer) clearTimeout(errorTimer);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-6 pt-8 pb-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden="true" />
              <div role="status" aria-live="polite">
                <h1 className="text-2xl font-bold">Verifying your email…</h1>
                <p className="mt-2 text-muted-foreground">Just a moment.</p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="grid h-16 w-16 place-items-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" aria-hidden="true" />
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
