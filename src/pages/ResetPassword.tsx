import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/FormAlert";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { passwordOnlySchema } from "@/features/auth/schemas/auth.schemas";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { PasswordStrengthMeter } from "@/features/auth/components/PasswordStrengthMeter";
import { scorePassword } from "@/features/auth/utils/passwordStrength";
import type { PasswordStrength } from "@/features/auth/types/auth.types";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "Very weak",
    color: "bg-destructive",
  });

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event — Supabase fires this when the
    // user arrives via the reset-password magic link. We gate the form on it
    // so the user can't submit before the session is established.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if there is already an active session (e.g. the user refreshed
    // the page after clicking the link).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => {
      subscription.unsubscribe(); // prevent memory leak
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate using the standalone password schema
    try {
      passwordOnlySchema.parse({ password, confirmPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      toast.success("Password updated successfully.");
      // Session is already active after password recovery — go straight to feed
      navigate("/feed", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader>
          <CardTitle>Set new password</CardTitle>
          <CardDescription>
            Please enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" aria-label="Reset password form">
              <FormAlert message={error} severity="error" />

              <div className="space-y-2">
                <Label htmlFor="reset-password">New Password</Label>
                <PasswordInput
                  id="reset-password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordStrength(scorePassword(e.target.value));
                  }}
                  disabled={loading}
                />
                {password && (
                  <PasswordStrengthMeter password={password} strength={passwordStrength} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-confirm-password">Confirm Password</Label>
                <PasswordInput
                  id="reset-confirm-password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={!password || !confirmPassword || loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
