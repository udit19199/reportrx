"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportsDrawer } from "./components/reports-drawer";
import { ReportContent } from "./report-content";
import { ReportComparison } from "./report-comparison";
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
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
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

  const handleToggleCompareMode = useCallback(() => {
    setCompareMode((prev) => {
      if (prev) {
        // Exiting compare mode — clear selections
        setCompareSelection([]);
      }
      return !prev;
    });
  }, []);

  const handleCompareSelect = useCallback((reportId: string) => {
    setCompareSelection((prev) => {
      if (prev.includes(reportId)) {
        return prev.filter((id) => id !== reportId);
      }
      if (prev.length >= 2) return prev;
      return [...prev, reportId];
    });
  }, []);

  const handleStartCompare = useCallback(() => {
    setShowCompare(true);
    setCompareMode(false);
  }, []);

  const handleCloseCompare = useCallback(() => {
    setShowCompare(false);
    setCompareSelection([]);
  }, []);

  // Resolve compare reports from selected IDs
  const compareReports = useMemo(
    () => workspace.reports.filter((r) => compareSelection.includes(r.id)),
    [workspace.reports, compareSelection]
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
        onRename={workspace.renameReport}
        onReprocess={workspace.reprocessReport}
        onRefresh={workspace.refreshReports}
        compareMode={compareMode}
        compareSelection={compareSelection}
        onToggleCompareMode={handleToggleCompareMode}
        onCompareSelect={handleCompareSelect}
        onStartCompare={handleStartCompare}
      />

      {showCompare && compareReports.length === 2 ? (
        <ReportComparison
          reportA={compareReports[0]}
          reportB={compareReports[1]}
          onClose={handleCloseCompare}
        />
      ) : workspace.selected ? (
        <ReportContent
          report={workspace.selected}
          query={workspace.query}
          answer={workspace.answer}
          sources={workspace.sources}
          analyzing={workspace.analyzing}
          trends={workspace.trends}
          reprocessing={workspace.reprocessingReportId === workspace.selected.id}
          onQueryChange={workspace.setQuery}
          onAnalyze={workspace.analyzeSelected}
          onReprocess={workspace.reprocessReport}
        />
      ) : (
        <WorkspaceEmptyState
          title="No report selected"
          description="Upload a PDF report to see your analysis, or open Reports in the sidebar to explore existing reports."
        />
      )}
    </div>
  );
}
