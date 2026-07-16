import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FormAlert } from "@/components/FormAlert";
import { Loader2, Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { passwordSchema } from "@/features/auth/schemas/auth.schemas";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { AppLayout } from "@/components/AppLayout";

const Settings = () => {
  const { user } = useAuth();
  const { isDark, toggle } = useTheme();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      passwordSchema.parse(password);
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
      setPassword("");
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6 pb-8">
        <div>
          <h1 className="font-display text-[clamp(1.5rem,3vw,2.2rem)] font-bold leading-tight tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="border border-border/50 bg-card px-6 py-5" style={{ borderRadius: "0" }}>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-foreground/80">Appearance</h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-5">
            Toggle between light and dark theme.
          </p>
          <div className="flex items-center justify-between max-w-sm">
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="h-4 w-4 text-accent" aria-hidden="true" />
              ) : (
                <Sun className="h-4 w-4 text-accent" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">Dark mode</p>
                <p className="text-xs text-muted-foreground">{isDark ? "On" : "Off"}</p>
              </div>
            </div>
            <Switch checked={isDark} onCheckedChange={toggle} aria-label="Toggle dark mode" />
          </div>
        </div>

        <div className="border border-border/50 bg-card px-6 py-5" style={{ borderRadius: "0" }}>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-foreground/80">Security</h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-5">
            Update your password.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm" aria-label="Update password form">
            <FormAlert message={error} severity="error" />

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-xs font-medium">New Password</Label>
              <Input
                id="new-password"
                type="password"
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ borderRadius: "2px" }}
              />
            </div>

            <Button type="submit" disabled={!password || loading} style={{ borderRadius: "2px" }}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update password
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
