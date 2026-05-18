import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
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
        {children}
      </AppShell>
    </Suspense>
  );
}
