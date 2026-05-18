import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SettingsClient } from "@/app/settings/settings-client";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Settings | ReportRx",
  description: "Manage your account settings.",
};

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <Suspense fallback={null}>
      <AppShell userEmail={session.user.email}>
        <SettingsClient userEmail={session.user.email} />
      </AppShell>
    </Suspense>
  );
}
