import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { AppHeader } from "@/components/app-header";
import { getSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <Suspense fallback={null}>
      <AppShell userEmail={session?.user.email ?? ""}>
        <AppHeader />
        {children}
      </AppShell>
    </Suspense>
  );
}
