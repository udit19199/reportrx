"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, 
  Loader2, 
  User, 
  AlertTriangle,
  Trash2,
  FileText,
  LogOut
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { readConsentPreference, writeConsentPreference } from "@/lib/consent";
import { api } from "@/lib/api";

export function SettingsClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [consent, setConsent] = useState<boolean | null>(() =>
    readConsentPreference()
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSave = async () => {
    if (consent === null) return;
    setSaving(true);
    writeConsentPreference(consent);
    setSaved(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSaved(false);
    setSaving(false);
  };

  const handleSignOut = async () => {
    await api.logout();
    router.push("/");
  };

  const handleDeleteAccount = () => {
    // UI placeholder - backend not implemented
    setShowDeleteDialog(false);
    alert("Account deletion is not yet implemented.");
  };

  return (
    <main
      id="main-content"
      className="min-h-screen px-4 py-6 md:px-6 lg:px-8 lg:py-10"
    >
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-medium text-[var(--foreground)]">
            Settings
          </h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Manage your account and preferences
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Account Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <User className="size-4 text-[var(--muted-foreground)]" />
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
                  <LogOut className="mr-2 size-3.5" />
                  Sign out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Consent */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <ShieldCheck className="size-4 text-[var(--muted-foreground)]" />
                Privacy & Consent
              </CardTitle>
              <CardDescription>
                Control how your data is processed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-[var(--muted)]/30">
                <AlertDescription className="text-xs">
                  Your consent preference controls whether uploaded reports are
                  processed by third-party AI providers. This setting is stored
                  locally in your browser.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-4">
                <div>
                  <Label
                    htmlFor="consent-toggle"
                    className="text-sm font-medium"
                  >
                    AI Processing Consent
                  </Label>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Allow AI analysis of your reports
                  </p>
                </div>
                <Switch
                  id="consent-toggle"
                  checked={consent ?? false}
                  onCheckedChange={(checked) => setConsent(checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted-foreground)]">
                  Status:{" "}
                  <span className={consent ? "text-emerald-600" : ""}>
                    {consent ? "Enabled" : "Disabled"}
                  </span>
                </span>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                >
                  {saving && (
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                  )}
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>

              {saved && (
                <p className="text-center text-sm text-emerald-600">
                  Changes saved successfully
                </p>
              )}
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-red-200/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium text-red-600">
                <AlertTriangle className="size-4" />
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
                  <Trash2 className="mr-2 size-3.5" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2">
              <FileText className="size-3.5" />
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
