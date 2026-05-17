"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, 
  AlertTriangle,
  Trash2,
  FileText,
  LogOut
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { api } from "@/lib/api";

export function SettingsClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteNotImplemented, setDeleteNotImplemented] = useState(false);

  const handleSignOut = async () => {
    await api.logout();
    router.push("/");
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(false);
    setDeleteNotImplemented(true);
    setTimeout(() => setDeleteNotImplemented(false), 5000);
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
            Manage your account and preferences
          </p>
        </div>

        <div className="flex flex-col gap-6">
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
