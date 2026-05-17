import { AppHeader } from "@/components/app-header";
import { SettingsClient } from "@/app/settings/settings-client";

export default async function SettingsPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <SettingsClient />
    </div>
  );
}
