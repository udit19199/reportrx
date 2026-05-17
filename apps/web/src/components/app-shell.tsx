"use client";

import { WorkspaceDrawerProvider } from "@/components/workspace-drawer-context";
import { NavRail } from "@/components/nav-rail";

type AppShellProps = {
  userEmail?: string;
  children: React.ReactNode;
};

export function AppShell({ userEmail, children }: AppShellProps) {
  return (
    <WorkspaceDrawerProvider>
      <div className="app-shell">
        <NavRail userEmail={userEmail} />
        <main className="app-content" id="main-content">
          {children}
        </main>
      </div>
    </WorkspaceDrawerProvider>
  );
}
