"use client";

import { useEffect, useState } from "react";
import { ReportsDrawer } from "./components/reports-drawer";
import { ReportContent } from "./report-content";
import { WorkspaceEmptyState } from "./components/workspace-empty-state";
import type { ApiReport, TrendDataPoint } from "@/lib/api";
import { useWorkspaceController } from "./use-workspace-controller";

type WorkspaceProps = {
  initialReports: ApiReport[];
  initialTrends?: Record<string, TrendDataPoint[]>;
};

export function Workspace({ initialReports, initialTrends = {} }: WorkspaceProps) {
  const workspace = useWorkspaceController({ initialReports, initialTrends });
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Cmd+K to toggle the reports drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
        onSelect={(report) => {
          workspace.selectReport(report);
          setDrawerOpen(false);
        }}
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
          onOpenDrawer={() => setDrawerOpen(true)}
        />
      ) : (
        <WorkspaceEmptyState
          title="No report selected"
          description="Upload a PDF report to see your analysis, or press ⌘K to browse existing reports."
          onOpenDrawer={() => setDrawerOpen(true)}
        />
      )}
    </div>
  );
}
