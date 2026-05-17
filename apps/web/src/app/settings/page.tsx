import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { SettingsClient } from "@/app/settings/settings-client";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Settings | ReportRx",
  description: "Manage your privacy and consent preferences.",
};

export default async function SettingsPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen">
      <AppHeader />
      <SettingsClient userEmail={session?.user.email ?? ""} />
    </div>
  );
}
