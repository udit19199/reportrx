"use client";

import { useState } from "react";
import { Loader2, FileX2 } from "lucide-react";
import type { ApiReport, TrendDataPoint } from "@/lib/api";
import { ReportDetailGrid } from "./report-detail-grid";

type ReportContentProps = {
  report: ApiReport;
  query: string;
  answer: string | null;
  sources: string[];
  analyzing: boolean;
  consentGranted: boolean;
  trends?: Record<string, TrendDataPoint[]>;
  onQueryChange: (value: string) => void;
  onAnalyze: () => void;
  onOpenDrawer?: () => void;
};

const STATUS_LABEL: Record<string, { text: string; dot: string }> = {
  ready: { text: "Analyzed", dot: "bg-emerald-500" },
  processing: { text: "Processing", dot: "bg-amber-500" },
  pending: { text: "Processing", dot: "bg-amber-500" },
  failed: { text: "Failed", dot: "bg-red-500" },
};

export function ReportContent({
  report,
  query,
  answer,
  sources,
  analyzing,
  consentGranted,
  trends,
  onQueryChange,
  onAnalyze,
  onOpenDrawer,
}: ReportContentProps) {
  const [showFullData, setShowFullData] = useState(false);
  const status = STATUS_LABEL[report.status] ?? { text: report.status, dot: "bg-[var(--primary)]/40" };
  const isProcessing = report.status === "processing" || report.status === "pending";

  return (
    <div className="min-h-screen">
      {/* ── Sticky Header ────────────────────────── */}
      <header className="app-top-bar">
        <div className="app-top-bar-inner mx-auto max-w-5xl">
          {/* Left: date + status */}
          <div className="flex min-w-0 items-center gap-3">
            <time
              dateTime={report.uploadedAt}
              className="text-lg font-medium text-[var(--foreground)]"
            >
              {new Date(report.uploadedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
            <span className="flex items-center gap-1.5 rounded-full border border-[var(--border)]/40 bg-[var(--card)] px-2.5 py-0.5 text-[0.625rem] font-medium tracking-wide text-[var(--muted-foreground)]">
              <span className={`inline-block size-1.5 rounded-full ${status.dot} ${isProcessing ? "animate-pulse" : ""}`} />
              {status.text}
            </span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-4">

            {report.status === "ready" && (
              <button
                onClick={() => setShowFullData(!showFullData)}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                {showFullData ? "Collapse" : "Full data"}
              </button>
            )}

            {onOpenDrawer && (
              <button
                onClick={onOpenDrawer}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <kbd className="rounded border border-[var(--border)] bg-[var(--muted)]/50 px-1.5 py-0.5 text-xs font-medium">
                  ⌘K
                </kbd>
                <span className="hidden sm:inline">Reports</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 py-6 md:px-8 lg:px-12 lg:py-8">
        {isProcessing && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="size-5 animate-spin text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)]">Analyzing report…</p>
          </div>
        )}

        {report.status === "failed" && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <FileX2 className="size-5 text-destructive" />
            <p className="text-sm font-medium text-[var(--foreground)]">Processing failed</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {report.errorMessage ?? "Please try uploading the report again."}
            </p>
          </div>
        )}

        {report.status === "ready" && report.parsedData && (
          <ReportDetailGrid
            data={report.parsedData}
            trends={trends}
            showFullData={showFullData}
            query={query}
            consentGranted={consentGranted}
            analyzing={analyzing}
            answer={answer}
            sources={sources}
            onQueryChange={onQueryChange}
            onAnalyze={onAnalyze}
          />
        )}
      </div>
    </div>
  );
}
