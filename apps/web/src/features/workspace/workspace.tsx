"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportsDrawer } from "./components/reports-drawer";
import { ReportContent } from "./report-content";
import { WorkspaceEmptyState } from "./components/workspace-empty-state";
import { useRegisterReportsDrawer } from "@/components/workspace-drawer-context";
import type { ApiReport, TrendDataPoint } from "@/lib/api";
import { useWorkspaceController } from "./use-workspace-controller";

type WorkspaceProps = {
  initialReports: ApiReport[];
  initialTrends?: Record<string, TrendDataPoint[]>;
};

export function Workspace({ initialReports, initialTrends = {} }: WorkspaceProps) {
  const workspace = useWorkspaceController({ initialReports, initialTrends });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const drawerControls = useMemo(
    () => ({
      open: () => setDrawerOpen(true),
      close: () => setDrawerOpen(false),
      toggle: () => setDrawerOpen((prev) => !prev),
    }),
    []
  );

  useRegisterReportsDrawer(drawerControls);

  useEffect(() => {
    if (searchParams.get("reports") === "open") {
      setDrawerOpen(true);
      router.replace("/app", { scroll: false });
    }
  }, [searchParams, router]);

  const handleSelectReport = useCallback(
    (report: ApiReport) => {
      workspace.selectReport(report);
      setDrawerOpen(false);
    },
    [workspace]
  );

  return (
    <div className="min-h-screen">
      <ReportsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        reports={workspace.reports}
        selected={workspace.selected}
        uploading={workspace.uploading}
        loading={workspace.loading}
        uploadError={workspace.uploadError}
        onSelect={handleSelectReport}
        onUpload={workspace.uploadReport}
        onDelete={workspace.deleteReport}
        onRefresh={workspace.refreshReports}
      />

      {workspace.selected ? (
        <ReportContent
          report={workspace.selected}
          query={workspace.query}
          answer={workspace.answer}
          sources={workspace.sources}
          analyzing={workspace.analyzing}
          consentGranted={workspace.consentGranted}
          trends={workspace.trends}
          onQueryChange={workspace.setQuery}
          onAnalyze={workspace.analyzeSelected}
        />
      ) : (
        <WorkspaceEmptyState
          title="No report selected"
          description="Upload a PDF report to see your analysis, or open Reports in the sidebar to browse existing reports."
        />
      )}
    </div>
  );
}
