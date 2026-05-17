import { Suspense } from "react";
import { NavRail } from "@/components/nav-rail";
import { getSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="app-shell">
      <Suspense fallback={null}>
        <NavRail userEmail={session?.user.email ?? ""} />
      </Suspense>
      <main className="app-content" id="main-content">
        {children}
      </main>
    </div>
  );
}
