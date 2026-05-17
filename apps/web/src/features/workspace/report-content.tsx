"use client";

import { FileX2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApiReport, TrendDataPoint } from "@/lib/api";
import { ReportDetailGrid } from "./components/report-detail-grid";

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

const STAGE_LABELS: Record<string, string> = {
  queued: "Queued for processing",
  parsing: "Parsing PDF document",
  embedding: "Generating vector embeddings",
  extracting: "Extracting lab values",
  interpreting: "Interpreting results",
  saving: "Finalizing report",
  complete: "Complete",
  failed: "Failed",
};

const getStatusText = (report: ApiReport): string => {
  const { status, currentStage, errorMessage } = report;

  if (status === "ready") {
    return "Review your report summary, insights, and recommended next steps.";
  }

  if (status === "processing" || status === "pending") {
    const stageLabel = currentStage ? STAGE_LABELS[currentStage] : null;
    return stageLabel
      ? `${stageLabel}…`
      : "Your report is being analyzed. This may take a minute.";
  }

  if (status === "failed") {
    return errorMessage ?? "This report could not be processed.";
  }

  return "This report could not be processed.";
};

const statusVariant = (status: ApiReport["status"]) => {
  if (status === "failed") return "destructive";
  if (status === "ready") return "default";
  return "secondary";
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
  const isProcessing = report.status === "processing" || report.status === "pending";

  return (
    <section className="min-h-screen bg-background px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <Card className="flex min-h-[calc(100vh-2rem)] flex-col border-border/60 bg-card/90 shadow-sm backdrop-blur md:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-4rem)]">
        <CardHeader className="border-b border-border/60 px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl font-display">{report.filename}</CardTitle>
                {isProcessing && (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                )}
                {report.status === "failed" && (
                  <FileX2 className="size-4 text-destructive" />
                )}
              </div>
              <CardDescription className="mt-1">
                {getStatusText(report)}
                {isProcessing && report.currentStage && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse" />
                  </span>
                )}
              </CardDescription>
            </div>
            <Badge variant={statusVariant(report.status)}>{report.status}</Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-6 px-6 py-6">
          <ReportDetailGrid
            report={report}
            query={query}
            answer={answer}
            sources={sources}
            analyzing={analyzing}
            consentGranted={consentGranted}
            trends={trends}
            onQueryChange={onQueryChange}
            onAnalyze={onAnalyze}
          />
        </CardContent>
      </Card>
    </section>
  );
}
