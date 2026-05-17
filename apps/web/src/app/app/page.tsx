import { WorkspaceErrorBoundary } from "@/components/error-boundary";
import { AppHeader } from "@/components/app-header";
import { Workspace } from "@/features/workspace/workspace";

export default async function AppPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <WorkspaceErrorBoundary>
        <Workspace initialReports={[]} />
      </WorkspaceErrorBoundary>
    </div>
  );
}
