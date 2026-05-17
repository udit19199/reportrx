"use client";

import { Loader2, FileX2 } from "lucide-react";
import type { ApiReport, TrendDataPoint } from "@/lib/api";
import { ReportDetailGrid } from "./report-detail-grid";

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

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
}: ReportContentProps) {
  const status = STATUS_LABEL[report.status] ?? {
    text: report.status,
    dot: "bg-[var(--primary)]/40",
  };
  const isProcessing =
    report.status === "processing" || report.status === "pending";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-6 md:px-8 lg:px-12 lg:py-8">
        <div className="mb-6 flex min-w-0 items-center gap-3">
          <time
            dateTime={report.uploadedAt}
            className="text-lg font-medium text-[var(--foreground)]"
          >
            {formatDate(report.uploadedAt)}
          </time>
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--border)]/40 bg-[var(--card)] px-2.5 py-0.5 text-[0.625rem] font-medium tracking-wide text-[var(--muted-foreground)]">
            <span
              className={`inline-block size-1.5 rounded-full ${status.dot} ${isProcessing ? "animate-pulse" : ""}`}
            />
            {status.text}
          </span>
        </div>

        {isProcessing && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="size-5 animate-spin text-[var(--muted-foreground)]" aria-hidden="true" />
            <p className="text-sm text-[var(--muted-foreground)]">
              Analyzing report…
            </p>
          </div>
        )}

        {report.status === "failed" && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <FileX2 className="size-5 text-destructive" aria-hidden="true" />
            <p className="text-sm font-medium text-[var(--foreground)]">
              Processing failed
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {report.errorMessage ?? "Please try uploading the report again."}
            </p>
          </div>
        )}

        {report.status === "ready" && report.parsedData && (
          <ReportDetailGrid
            data={report.parsedData}
            trends={trends}
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
