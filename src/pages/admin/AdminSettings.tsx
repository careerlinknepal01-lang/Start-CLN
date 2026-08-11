import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";

const SETTINGS_KEY = "cln-admin-settings";

interface AdminSettingsData {
  siteName: string;
  maintenanceMode: boolean;
}

const DEFAULT_SETTINGS: AdminSettingsData = {
  siteName: "CareerLink Nepal",
  maintenanceMode: false,
};

function loadSettings(): AdminSettingsData {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) { console.warn(e); }
  return DEFAULT_SETTINGS;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<AdminSettingsData>(loadSettings);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setIsDirty(false);
    toast.info("Settings saved locally only — no live platform changes were made.");
  };

  const update = <K extends keyof AdminSettingsData>(key: K, value: AdminSettingsData[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Settings" subtitle="Preview basic platform settings stored in this browser." />

      <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
        Not yet connected — these controls are local previews and do not change the live platform.
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">General</CardTitle>
          <CardDescription>Local preview only. Supabase-backed settings will be connected in a later phase.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="site-name">Site Name</Label>
            <Input
              id="site-name"
              value={settings.siteName}
              onChange={(e) => update("siteName", e.target.value)}
              placeholder="CareerLink Nepal"
            />
            <p className="text-xs text-muted-foreground">
              Displayed in the browser tab and header area.
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground">
                When enabled, regular users will see a maintenance notice. (UI only — requires backend integration for enforcement.)
              </p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => update("maintenanceMode", checked)}
            />
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!isDirty} className="gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
