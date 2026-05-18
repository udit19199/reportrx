"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  AlertTriangle,
  Trash2,
  FileText,
  LogOut,
  Loader2,
  CheckCircle2,
  Heart,
  Weight,
  Ruler,
  Baby,
  CalendarDays,
} from "lucide-react";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, type UserProfile } from "@/lib/api";

export function SettingsClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Account update form state
  const [email, setEmail] = useState(userEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  // Profile form state
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [pregnant, setPregnant] = useState(false);
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Load profile on mount
  useEffect(() => {
    api.getProfile().then((data) => {
      setProfile(data.user);
      setDateOfBirth(data.user.dateOfBirth ?? "");
      setGender(data.user.gender ?? "");
      setWeightKg(data.user.weightKg?.toString() ?? "");
      setHeightCm(data.user.heightCm?.toString() ?? "");
      setPregnant(data.user.pregnant ?? false);
    }).catch(() => {
      // Non-critical — profile form stays empty
    }).finally(() => {
      setProfileLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    await api.logout();
    router.push("/");
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (newPassword && newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const hasEmailChange = email !== userEmail;
    const hasPasswordChange = !!newPassword;

    if (!hasEmailChange && !hasPasswordChange) {
      toast.error("No changes to save");
      return;
    }

    setUpdating(true);
    try {
      const body: { email?: string; currentPassword: string; newPassword?: string } = {
        currentPassword,
      };
      if (hasEmailChange) body.email = email;
      if (hasPasswordChange) body.newPassword = newPassword;

      const result = await api.updateAccount(body);
      toast.success("Account updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setEmail(result.user.email);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileUpdating(true);
    try {
      const body: Record<string, unknown> = {};
      if (dateOfBirth) body.dateOfBirth = dateOfBirth;
      if (gender) body.gender = gender;
      if (weightKg) body.weightKg = parseFloat(weightKg);
      if (heightCm) body.heightCm = parseFloat(heightCm);
      body.pregnant = pregnant;

      const result = await api.updateProfile(body as Parameters<typeof api.updateProfile>[0]);
      setProfile(result.user);
      toast.success("Profile updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      toast.success("Account deleted");
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-medium text-[var(--foreground)]">
            Settings
          </h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Manage your account, profile, and preferences
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Heart className="size-4 text-[var(--primary)]" aria-hidden="true" />
                Your Profile
              </CardTitle>
              <CardDescription>
                Used to show age- and gender-appropriate reference ranges for your lab results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-4 animate-spin text-[var(--muted-foreground)]" />
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-dob">Date of birth</Label>
                      <div className="relative">
                        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]/50" aria-hidden="true" />
                        <Input
                          id="profile-dob"
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-gender">Gender</Label>
                      <select
                        id="profile-gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-[var(--border)]/60 bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/40 focus:border-[var(--primary)]/30 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/20"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-weight">Weight (kg)</Label>
                      <div className="relative">
                        <Weight className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]/50" aria-hidden="true" />
                        <Input
                          id="profile-weight"
                          type="number"
                          step="0.1"
                          min="1"
                          max="500"
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value)}
                          placeholder="e.g. 70"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-height">Height (cm)</Label>
                      <div className="relative">
                        <Ruler className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]/50" aria-hidden="true" />
                        <Input
                          id="profile-height"
                          type="number"
                          step="0.5"
                          min="1"
                          max="300"
                          value={heightCm}
                          onChange={(e) => setHeightCm(e.target.value)}
                          placeholder="e.g. 170"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {gender === "female" && (
                    <div className="flex items-center gap-3 rounded-lg border border-[var(--border)]/40 bg-[var(--muted)]/30 px-4 py-3">
                      <Baby className="size-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                      <div className="flex-1">
                        <label htmlFor="profile-pregnant" className="text-sm font-medium">
                          Currently pregnant
                        </label>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Thyroid and other reference ranges adjust during pregnancy
                        </p>
                      </div>
                      <label className="relative inline-flex h-6 w-11 cursor-pointer items-center">
                        <input
                          id="profile-pregnant"
                          type="checkbox"
                          className="peer sr-only"
                          checked={pregnant}
                          onChange={(e) => setPregnant(e.target.checked)}
                        />
                        <span className="absolute inset-0 rounded-full border border-[var(--border)]/60 bg-[var(--muted)] transition-colors peer-checked:border-[var(--primary)]/30 peer-checked:bg-[var(--primary)]/10 peer-focus:ring-1 peer-focus:ring-[var(--primary)]/20"></span>
                        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5 peer-checked:bg-[var(--primary)]"></span>
                      </label>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={profileUpdating}>
                      {profileUpdating ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />
                          Save profile
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-[var(--muted-foreground)] italic">
                    Reference ranges shown in reports are adjusted based on your profile demographics.
                    Always verify against the ranges printed on your actual lab report.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Account Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <User className="size-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Email</p>
                  <p className="font-medium">{userEmail}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-2 size-3.5" aria-hidden="true" />
                  Sign out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Update Account */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Lock className="size-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                Update email or password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateAccount} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="settings-email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]/50" aria-hidden="true" />
                    <Input
                      id="settings-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="settings-current-password">Current password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]/50" aria-hidden="true" />
                    <Input
                      id="settings-current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Required to save changes"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-new-password">New password (optional)</Label>
                    <Input
                      id="settings-new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-confirm-password">Confirm new password</Label>
                    <Input
                      id="settings-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updating}>
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />
                        Save changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-red-200/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium text-red-600">
                <AlertTriangle className="size-4" aria-hidden="true" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete account</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Permanently remove all your data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 size-3.5" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2">
              <FileText className="size-3.5" aria-hidden="true" />
              <span>ReportRx</span>
            </div>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your reports and data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Deleting…
                </>
              ) : (
                "Delete account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
