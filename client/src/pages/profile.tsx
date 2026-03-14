import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { auth } from "@/lib/api";
import { User, Loader2, Save, KeyRound, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: auth.me,
  });

  // Email edit state
  const [email, setEmail] = useState("");
  const [emailEditing, setEmailEditing] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: (data: { email: string }) =>
      apiRequest("PATCH", "/api/auth/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      setEmailEditing(false);
      toast({ title: "Profile updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiRequest("PATCH", "/api/auth/change-password", data),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password changed successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleEmailSave = () => {
    updateProfileMutation.mutate({ email });
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

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
      <div className="flex-1 overflow-auto p-6 space-y-6 max-w-2xl">

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shrink-0">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold">{user?.username}</p>
                <p className="text-sm text-muted-foreground">{user?.email || "No email set"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Member since {formatDate((user as any)?.createdAt)}
                </p>
              </div>
            </div>

            {/* Username — read only, can't change (unique constraint) */}
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={user?.username || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Username cannot be changed</p>
            </div>

            {/* Email — editable */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              {emailEditing ? (
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter new email"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleEmailSave}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEmailEditing(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input id="email-display" value={user?.email || ""} disabled className="bg-muted" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEmail(user?.email || ""); setEmailEditing(true); }}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Change Password</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={!currentPassword || !newPassword || !confirmPassword || changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
              ) : "Update Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">Irreversible actions</p>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account and all associated data. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => toast({ title: "Account deletion coming soon", description: "Please contact support to delete your account." })}
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
