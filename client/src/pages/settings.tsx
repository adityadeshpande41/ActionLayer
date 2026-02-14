import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { Download, Moon, Sun, Shield, FileJson, Zap, Mail } from "lucide-react";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    strictJson: true,
    requireEvidence: true,
    autoJira: false,
    autoFollowUp: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast({ title: "Setting updated", description: `${key} has been toggled.` });
  };

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Settings" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card data-testid="card-analysis-settings">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Analysis Settings</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Configure how ActionLayer processes your transcripts</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 mt-0.5">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Strict JSON Validation</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Enforce strict schema validation on all outputs</p>
                  </div>
                </div>
                <Switch
                  checked={settings.strictJson}
                  onCheckedChange={() => toggleSetting("strictJson")}
                  data-testid="switch-strict-json"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 mt-0.5">
                    <FileJson className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Require Evidence Snippets</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">All decisions and risks must include source evidence</p>
                  </div>
                </div>
                <Switch
                  checked={settings.requireEvidence}
                  onCheckedChange={() => toggleSetting("requireEvidence")}
                  data-testid="switch-require-evidence"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 mt-0.5">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Auto-generate Jira Drafts</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Automatically create Jira ticket drafts after analysis</p>
                  </div>
                </div>
                <Switch
                  checked={settings.autoJira}
                  onCheckedChange={() => toggleSetting("autoJira")}
                  data-testid="switch-auto-jira"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 mt-0.5">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Auto-generate Follow-up Drafts</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Create follow-up email drafts automatically</p>
                  </div>
                </div>
                <Switch
                  checked={settings.autoFollowUp}
                  onCheckedChange={() => toggleSetting("autoFollowUp")}
                  data-testid="switch-auto-followup"
                />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-appearance">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Appearance</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Customize the look and feel of ActionLayer</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 mt-0.5">
                    {theme === "light" ? (
                      <Sun className="h-4 w-4 text-primary" />
                    ) : (
                      <Moon className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Dark Mode</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {theme === "dark" ? "Currently using dark theme" : "Currently using light theme"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                  data-testid="switch-theme"
                />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-data-export">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Data Export</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Export your project data and analysis history</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 mt-0.5">
                    <Download className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Export All Data</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Download decisions, risks, and action items as JSON</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast({ title: "Export started", description: "Your data export is being prepared." })}
                  data-testid="button-export-data"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
