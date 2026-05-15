"use client";

import { ReportSidebar } from "./report-sidebar";
import { ReportContent } from "./report-content";
import { WorkspaceEmptyState } from "./components/workspace-empty-state";
import type { ApiReport } from "@/lib/api";
import { useWorkspaceController } from "./use-workspace-controller";

type WorkspaceProps = {
  initialReports: ApiReport[];
};

export function Workspace({ initialReports }: WorkspaceProps) {
  const workspace = useWorkspaceController({ initialReports });

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="grid min-h-screen xl:grid-cols-[380px_minmax(0,1fr)] 2xl:grid-cols-[420px_minmax(0,1fr)]">
        <ReportSidebar
          reports={workspace.reports}
          selected={workspace.selected}
          uploading={workspace.uploading}
          onSelect={workspace.selectReport}
          onUpload={workspace.uploadReport}
          onDelete={workspace.deleteSelected}
        />

        {workspace.selected ? (
          <ReportContent
            report={workspace.selected}
            query={workspace.query}
            answer={workspace.answer}
            sources={workspace.sources}
            analyzing={workspace.analyzing}
            consentGranted={workspace.consentGranted}
            error={workspace.error}
            onQueryChange={workspace.setQuery}
            onAnalyze={workspace.analyzeSelected}
          />
        ) : (
          <WorkspaceEmptyState
            title="Select a report from the sidebar to get started."
            description="Upload a PDF report to see your summary, insights, and recommended next steps."
          />
        )}
      </div>
    </main>
  );
}
