"use client";

import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  FileText,
  AlertCircle,
  FileBadge,
  AlertTriangle,
  Stethoscope,
  ClipboardList,
  ShieldAlert,
  BookOpen,
  Gauge,
} from "lucide-react";

import type { ApiReport, TrendDataPoint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CollapsibleSection } from "./collapsible-section";
import { TestResultsTable, type TestResult } from "./test-results-table";

type ReportDetailGridProps = {
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

function SectionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function ReportQuestionCard({
  query,
  consentGranted,
  analyzing,
  onQueryChange,
  onAnalyze,
}: Pick<ReportDetailGridProps, "query" | "consentGranted" | "analyzing" | "onQueryChange" | "onAnalyze">) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && query && consentGranted && !analyzing) {
      e.preventDefault();
      onAnalyze();
    }
  };

  return (
    <Card className="border-border/60 bg-background">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <ArrowRight className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Ask a question</CardTitle>
            <CardDescription>Grounded in the selected report</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Textarea
          id="report-question"
          placeholder="What does the impression mean?"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[140px] resize-none"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="inline-flex h-4 items-center gap-0.5 rounded border bg-muted px-1 text-[10px] font-medium">⌘</kbd> + <kbd className="inline-flex h-4 items-center gap-0.5 rounded border bg-muted px-1 text-[10px] font-medium">Enter</kbd> to submit
          </p>
          <Button onClick={onAnalyze} disabled={!query || !consentGranted || analyzing}>
            {analyzing ? <Loader2 className="size-4 animate-spin" data-icon="inline-start" /> : null}
            {analyzing ? "Analyzing" : "Get answer"}
          </Button>
        </div>

        {!consentGranted ? (
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>
              Consent is disabled. Enable it in{" "}
              <Link href="/settings" className="font-medium underline underline-offset-4">
                settings
              </Link>{" "}
              to analyze reports.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReportAnswerCard({ answer, sources }: Pick<ReportDetailGridProps, "answer" | "sources">) {
  if (!answer) return null;

  const paragraphs = answer.split("\n\n").filter(Boolean);

  return (
    <Card className="xl:col-span-2 border-border/60 bg-background">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Answer</CardTitle>
            <CardDescription>Evidence-based response from your report</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 text-sm leading-7 text-foreground/80">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {sources.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {sources.map((source, index) => (
                <Badge key={`${source}-${index}`} variant="outline">
                  {source}
                </Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

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

function ReportStateNotice({
  report,
}: Pick<ReportDetailGridProps, "report">) {
  if (report.status === "failed") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="size-4" />
          <AlertDescription>
            <p className="font-medium">Processing failed</p>
            <p className="mt-1 text-sm">{report.errorMessage ?? "Please try uploading the report again."}</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (report.status === "processing" || report.status === "pending") {
    const stageLabel = report.currentStage
      ? STAGE_LABELS[report.currentStage] ?? report.currentStage
      : null;

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-muted-foreground py-16">
        <Loader2 className="size-10 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-sm font-medium">
            {stageLabel ? `${stageLabel}…` : "Analyzing your report…"}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            This may take up to a minute depending on the document size.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-600";
  return (
    <div className="flex items-center gap-2">
      <Progress value={pct} className="h-2 w-20" />
      <span className={`text-sm font-medium ${color}`}>{pct}%</span>
    </div>
  );
}

function ParsedReportContent({
  data,
  trends,
  query,
  consentGranted,
  analyzing,
  answer,
  sources,
  onQueryChange,
  onAnalyze,
}: {
  data: Record<string, unknown>;
  trends?: Record<string, TrendDataPoint[]>;
  query: string;
  consentGranted: boolean;
  analyzing: boolean;
  answer: string | null;
  sources: string[];
  onQueryChange: (value: string) => void;
  onAnalyze: () => void;
}) {
  const patient = data.patient_information as Record<string, unknown> | undefined;
  const tests = data.tests as Array<Record<string, unknown>> | undefined;
  const abnormalFindings = data.abnormal_findings as Array<Record<string, unknown>> | undefined;
  const doctorImpression = data.doctor_impression as string[] | undefined;
  const recommendations = data.recommendations as string[] | undefined;
  const criticalAlerts = data.critical_alerts as string[] | undefined;
  const summary = data.plain_language_summary as string | undefined;
  const limitations = data.limitations as string[] | undefined;
  const confidence = data.overall_confidence as number | undefined;
  const docType = data.document_type as string | undefined;
  const reportDate = data.report_date as string | undefined;

  return (
    <div className="grid flex-1 gap-6 xl:grid-cols-2">
      {/* Header info */}
      {(docType || reportDate || patient || confidence !== undefined) && (
        <Card className="xl:col-span-2 border-border/60 bg-background">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <FileBadge className="size-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Report Details</CardTitle>
                <CardDescription>Document metadata and patient information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {docType && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Type</p>
                  <p className="text-sm font-medium mt-1">{docType}</p>
                </div>
              )}
              {reportDate && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Date</p>
                  <p className="text-sm font-medium mt-1">{reportDate}</p>
                </div>
              )}
              {patient && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Patient</p>
                  <p className="text-sm font-medium mt-1">
                    {patient.name as string} · {patient.age as string} · {patient.gender as string}
                  </p>
                </div>
              )}
              {confidence !== undefined && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Confidence</p>
                  <div className="mt-1">
                    <ConfidenceBadge value={confidence} />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Alerts */}
      {criticalAlerts && criticalAlerts.length > 0 && (
        <Card className="xl:col-span-2 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                <ShieldAlert className="size-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-base text-red-800 dark:text-red-300">Critical Alerts</CardTitle>
                <CardDescription className="text-red-600/80 dark:text-red-400/80">Requires immediate attention</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {criticalAlerts.map((alert, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                  <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                  <span>{alert}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {summary && (
        <CollapsibleSection icon={BookOpen} title="Summary" description="Plain language overview" defaultExpanded>
          <div className="text-sm leading-7 text-foreground/80 whitespace-pre-wrap">{summary}</div>
        </CollapsibleSection>
      )}

      {/* Doctor Impression */}
      {doctorImpression && doctorImpression.length > 0 && (
        <CollapsibleSection icon={Stethoscope} title="Doctor's Impression" description="Clinical assessment">
          <ul className="space-y-2">
            {doctorImpression.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="mt-1.5 size-1.5 rounded-full bg-primary/60 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Abnormal Findings */}
      {abnormalFindings && abnormalFindings.length > 0 && (
        <CollapsibleSection icon={AlertTriangle} title="Abnormal Findings" description="Out-of-range results">
          <div className="space-y-3">
            {abnormalFindings.map((f, i) => (
              <div key={i} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{f.finding as string}</p>
                  <Badge
                    variant={
                      f.severity === "severe" ? "destructive" :
                      f.severity === "moderate" ? "default" :
                      "secondary"
                    }
                  >
                    {f.severity as string}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{f.explanation as string}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Test Results */}
      {tests && tests.length > 0 && (
        <Card className="xl:col-span-2 border-border/60 bg-background">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Gauge className="size-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Test Results</CardTitle>
                <CardDescription>{tests.length} test{tests.length !== 1 ? "s" : ""} analyzed</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TestResultsTable tests={tests as unknown as TestResult[]} trends={trends} />
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <CollapsibleSection icon={ClipboardList} title="Recommendations" description="Suggested next steps">
          <ul className="space-y-2">
            {recommendations.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="mt-1.5 size-1.5 rounded-full bg-primary/60 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Limitations */}
      {limitations && limitations.length > 0 && (
        <CollapsibleSection icon={AlertCircle} title="Limitations" description="Analysis caveats">
          <ul className="space-y-2">
            {limitations.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      <ReportQuestionCard
        query={query}
        consentGranted={consentGranted}
        analyzing={analyzing}
        onQueryChange={onQueryChange}
        onAnalyze={onAnalyze}
      />

      <ReportAnswerCard answer={answer} sources={sources} />
    </div>
  );
}

export function ReportDetailGrid({
  report,
  query,
  answer,
  sources,
  analyzing,
  consentGranted,
  trends,
  onQueryChange,
  onAnalyze,
}: ReportDetailGridProps) {
  const isReady = report.status === "ready";

  if (report.status === "failed" || report.status === "processing" || report.status === "pending") {
    return <ReportStateNotice report={report} />;
  }

  return (
    <>
      {isReady && report.parsedData ? (
        <ParsedReportContent
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
      ) : (
        <div className="grid flex-1 gap-6 xl:grid-cols-2">
          <Card className="border-border/60 bg-background">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Summary</CardTitle>
                  <CardDescription>At-a-glance overview</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SectionSkeleton />
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-background">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Details</CardTitle>
                  <CardDescription>Report information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SectionSkeleton />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
