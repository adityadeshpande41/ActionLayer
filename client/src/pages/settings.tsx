import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Moon, Sun, Shield, FileJson, Zap, Mail, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { jira } from "@/lib/api";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    strictJson: true,
    requireEvidence: true,
    autoJira: false,
    autoFollowUp: false,
  });

  const [jiraConfig, setJiraConfig] = useState({
    baseUrl: "",
    email: "",
    apiToken: "",
  });

  // Check Google Calendar status
  const { data: googleStatus } = useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: () => fetch("/api/calendar/google/status").then(r => r.json()),
  });

  // Check Jira status
  const { data: jiraStatus } = useQuery({
    queryKey: ["jira-status"],
    queryFn: () => jira.getStatus(),
  });

  // Configure Jira mutation
  const configureJiraMutation = useMutation({
    mutationFn: (config: { baseUrl: string; email: string; apiToken: string }) => 
      jira.saveConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jira-status"] });
      toast({ title: "Jira Connected", description: "Your Jira account has been connected successfully." });
      setJiraConfig({ baseUrl: "", email: "", apiToken: "" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Connection Failed", 
        description: error.message || "Failed to connect to Jira. Check your credentials.",
        variant: "destructive" 
      });
    },
  });

  // Disconnect Jira mutation
  const disconnectJiraMutation = useMutation({
    mutationFn: () => fetch("/api/jira/disconnect", { method: "POST" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jira-status"] });
      toast({ title: "Jira Disconnected", description: "Your Jira account has been disconnected." });
    },
  });

  const handleJiraConnect = () => {
    if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken) {
      toast({ 
        title: "Missing Information", 
        description: "Please fill in all Jira fields.",
        variant: "destructive" 
      });
      return;
    }
    configureJiraMutation.mutate(jiraConfig);
  };

  const handleGoogleCalendarConnect = () => {
    if (googleStatus?.authUrl) {
      window.location.href = googleStatus.authUrl;
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast({ title: "Setting updated", description: `${key} has been toggled.` });
  };

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Settings" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card data-testid="card-integrations">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Integrations</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Connect your Google Calendar and Jira accounts</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Google Calendar */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 mt-0.5">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Google Calendar</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {googleStatus?.configured ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" /> Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Not connected
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant={googleStatus?.configured ? "outline" : "default"}
                  size="sm"
                  onClick={handleGoogleCalendarConnect}
                >
                  {googleStatus?.configured ? "Reconnect" : "Connect"}
                </Button>
              </div>
              
              <Separator />
              
              {/* Jira */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2 mt-0.5">
                      <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0z"/>
                      </svg>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Jira</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {jiraStatus?.configured ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" /> Connected to {jiraStatus.baseUrl}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Not connected
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {jiraStatus?.configured && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectJiraMutation.mutate()}
                    >
                      Disconnect
                    </Button>
                  )}
                </div>
                
                {!jiraStatus?.configured && (
                  <div className="space-y-2 pl-11">
                    <div>
                      <Label className="text-xs">Jira URL</Label>
                      <Input
                        placeholder="https://your-company.atlassian.net"
                        value={jiraConfig.baseUrl}
                        onChange={(e) => setJiraConfig({ ...jiraConfig, baseUrl: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        placeholder="your-email@company.com"
                        value={jiraConfig.email}
                        onChange={(e) => setJiraConfig({ ...jiraConfig, email: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">API Token</Label>
                      <Input
                        type="password"
                        placeholder="Your Jira API token"
                        value={jiraConfig.apiToken}
                        onChange={(e) => setJiraConfig({ ...jiraConfig, apiToken: e.target.value })}
                        className="h-8 text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Get your API token from{" "}
                        <a 
                          href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Atlassian Account Settings
                        </a>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleJiraConnect}
                      disabled={configureJiraMutation.isPending}
                      className="w-full"
                    >
                      {configureJiraMutation.isPending ? "Connecting..." : "Connect Jira"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
