"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApiReport } from "@/lib/api";
import { ReportDetailGrid } from "./components/report-detail-grid";

type ReportContentProps = {
  report: ApiReport;
  query: string;
  answer: string | null;
  sources: string[];
  analyzing: boolean;
  consentGranted: boolean;
  error: string;
  onQueryChange: (value: string) => void;
  onAnalyze: () => void;
};

const getStatusText = (status: ApiReport["status"]) => {
  if (status === "ready") {
    return "Review your report summary, insights, and recommended next steps.";
  }

  if (status === "processing" || status === "pending") {
    return "Your report is being analyzed. This may take a minute.";
  }

  return "This report could not be processed.";
};

export function ReportContent({
  report,
  query,
  answer,
  sources,
  analyzing,
  consentGranted,
  error,
  onQueryChange,
  onAnalyze,
}: ReportContentProps) {
  return (
    <section className="min-h-screen bg-background px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <Card className="flex min-h-[calc(100vh-2rem)] flex-col border-border/60 bg-card/90 shadow-sm backdrop-blur md:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-4rem)]">
        <CardHeader className="border-b border-border/60 px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="text-3xl">{report.filename}</CardTitle>
              <CardDescription>{getStatusText(report.status)}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={report.status === "failed" ? "destructive" : "secondary"}>{report.status}</Badge>
            </div>
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
            error={error}
            onQueryChange={onQueryChange}
            onAnalyze={onAnalyze}
          />
        </CardContent>
      </Card>
    </section>
  );
}
