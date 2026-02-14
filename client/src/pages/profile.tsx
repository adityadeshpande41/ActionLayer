import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/api";
import { User, Mail, Loader2 } from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const { data: user, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: auth.me,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <AppHeader title="Profile" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Profile" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Information</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              View and manage your account details
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center">
                <User className="h-10 w-10 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{user?.username}</h3>
                <p className="text-sm text-muted-foreground">{user?.email || "No email set"}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={user?.username || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Username cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email management coming soon
                </p>
              </div>

              <div className="space-y-2">
                <Label>Account Created</Label>
                <p className="text-sm">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your password and security settings
            </p>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              Change Password (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Irreversible actions
            </p>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" disabled>
              Delete Account (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
