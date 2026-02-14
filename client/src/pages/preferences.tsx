import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, Bell, Zap } from "lucide-react";

export default function Preferences() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState("70");

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Preferences" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Appearance
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize how ActionLayer looks
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage notification preferences
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive alerts for high-priority risks
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Analysis Settings
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure AI analysis behavior
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-analyze">Auto-analyze Uploads</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically run analysis on file upload
                </p>
              </div>
              <Switch
                id="auto-analyze"
                checked={autoAnalyze}
                onCheckedChange={setAutoAnalyze}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Confidence Threshold</Label>
                <p className="text-xs text-muted-foreground">
                  Flag items below this confidence level
                </p>
              </div>
              <Select value={confidenceThreshold} onValueChange={setConfidenceThreshold}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="60">60%</SelectItem>
                  <SelectItem value="70">70%</SelectItem>
                  <SelectItem value="80">80%</SelectItem>
                  <SelectItem value="90">90%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Note: These settings are stored locally and will reset when you clear browser data.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data & Privacy</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your data and privacy settings
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Retention</Label>
                <p className="text-xs text-muted-foreground">
                  How long to keep analysis data
                </p>
              </div>
              <Select defaultValue="90">
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="forever">Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Your data is currently stored in-memory and will be cleared on server restart.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
