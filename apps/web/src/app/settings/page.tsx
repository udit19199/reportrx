import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { SettingsClient } from "@/app/settings/settings-client";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Settings | ReportRx",
  description: "Manage your privacy and consent preferences.",
};

export default async function SettingsPage() {
  const session = await getSession();

  return (
    <Suspense fallback={null}>
      <AppShell userEmail={session?.user.email ?? ""}>
        <SettingsClient userEmail={session?.user.email ?? ""} />
      </AppShell>
    </Suspense>
  );
}
