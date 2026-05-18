"use client";

import { Loader2, FileX2, RefreshCw, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiReport, TrendDataPoint } from "@/lib/api";
import { formatReportDate } from "@/lib/utils";
import { ReportDetailGrid } from "./report-detail-grid";

type ReportContentProps = {
  report: ApiReport;
  query: string;
  answer: string | null;
  sources: string[];
  analyzing: boolean;
  reprocessing: boolean;
  trends?: Record<string, TrendDataPoint[]>;
  onQueryChange: (value: string) => void;
  onAnalyze: () => void;
  onReprocess: (reportId: string) => Promise<void>;
};

const STAGE_LABELS: Record<string, string> = {
  parsing: "Parsing PDF…",
  embedding: "Indexing document…",
  extracting: "Extracting test results…",
  interpreting: "Generating interpretation…",
  saving: "Finalizing…",
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
  reprocessing,
  trends,
  onQueryChange,
  onAnalyze,
  onReprocess,
}: ReportContentProps) {
  const status = STATUS_LABEL[report.status] ?? {
    text: report.status,
    dot: "bg-[var(--primary)]/40",
  };
  const isProcessing =
    report.status === "processing" || report.status === "pending";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-6 md:px-8 lg:px-12 lg:py-8 print:px-0 print:py-0">
        {/* ── Header bar ──────────────────────────────── */}
        <div className="mb-6 flex min-w-0 items-center gap-3 print:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <time
              dateTime={report.reportDate ?? report.uploadedAt}
              className="whitespace-nowrap text-lg font-medium text-[var(--foreground)]"
            >
              {formatReportDate(report.reportDate ?? report.uploadedAt)}
            </time>
            <span className="hidden truncate text-sm text-[var(--muted-foreground)]/60 md:inline" title={report.filename}>
              &middot; {report.filename}
            </span>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border)]/40 bg-[var(--card)] px-2.5 py-0.5 text-[0.625rem] font-medium tracking-wide text-[var(--muted-foreground)]">
            <span
              className={`inline-block size-1.5 rounded-full ${status.dot} ${isProcessing ? "animate-pulse" : ""}`}
            />
            {status.text}
          </span>
          {report.status === "ready" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="ml-auto gap-1.5 text-xs"
            >
              <Printer className="size-3.5" aria-hidden="true" />
              Export PDF
            </Button>
          )}
        </div>

        {/* ── Processing state ─────────────────────────── */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center gap-6 py-16">
            {/* Animated icon */}
            <div className="relative">
              <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200/20">
                <FileText className="size-9 text-white" aria-hidden="true" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-[var(--card)] bg-[var(--background)]">
                <Loader2 className="size-4 animate-spin text-amber-500" aria-hidden="true" />
              </div>
            </div>

            {/* Stage description */}
            <div className="text-center">
              <p className="text-base font-medium text-[var(--foreground)]">
                {report.currentStage && report.currentStage !== "queued"
                  ? STAGE_LABELS[report.currentStage] ?? report.currentStage
                  : "Starting analysis…"}
              </p>
              <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-[var(--muted-foreground)]">
                Extracting and interpreting data from &ldquo;{report.filename}&rdquo;.
              </p>
              <p className="mt-4 text-xs text-[var(--muted-foreground)]/50">
                This usually takes about 30–60 seconds
              </p>
            </div>

            {/* Animated progress bar */}
            <div className="h-1 w-56 overflow-hidden rounded-full bg-[var(--muted)]">
              <div className="h-full w-full origin-left animate-[loading-bar_2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
            </div>
          </div>
        )}

        {/* ── Failed state ────────────────────────────── */}
        {report.status === "failed" && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/20">
              <FileX2 className="size-7 text-red-500" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              Processing failed
            </p>
            <p className="max-w-md text-center text-xs text-[var(--muted-foreground)]">
              {report.errorMessage ?? "An unexpected error occurred while processing this report."}
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={reprocessing}
              onClick={() => onReprocess(report.id)}
              className="mt-2"
            >
              {reprocessing ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden="true" />
                  Reprocessing…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 size-3.5" aria-hidden="true" />
                  Retry processing
                </>
              )}
            </Button>
          </div>
        )}

        {/* ── Ready state ─────────────────────────────── */}
        {report.status === "ready" && report.parsedData && (
          <ReportDetailGrid
            data={report.parsedData}
            trends={trends}
            query={query}
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
