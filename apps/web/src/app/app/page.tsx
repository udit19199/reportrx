import type { Metadata } from "next";
import { Suspense } from "react";
import { WorkspaceErrorBoundary } from "@/components/error-boundary";
import { Workspace } from "@/features/workspace/workspace";
import { getServerReports, getServerTrends } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Workspace | ReportRx",
  description: "View and analyze your medical report summaries.",
};

export default async function AppPage() {
  const [reports, trendsData] = await Promise.all([
    getServerReports(),
    getServerTrends(),
  ]);

  return (
    <WorkspaceErrorBoundary>
      <Suspense fallback={null}>
        <Workspace initialReports={reports} initialTrends={trendsData.tests} />
      </Suspense>
    </WorkspaceErrorBoundary>
  );
}
