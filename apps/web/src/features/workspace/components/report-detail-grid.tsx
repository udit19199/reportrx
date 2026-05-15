"use client";

import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Lightbulb,
  ListChecks,
  FileText,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import type { ApiReport } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type ReportDetailGridProps = {
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

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-border/60 bg-background">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="size-5 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ReportQuestionCard({
  query,
  consentGranted,
  analyzing,
  onQueryChange,
  onAnalyze,
}: Pick<ReportDetailGridProps, "query" | "consentGranted" | "analyzing" | "onQueryChange" | "onAnalyze">) {
  return (
    <Card className="border-border/60 bg-background">
      <CardHeader>
        <CardTitle className="text-lg">Ask a question</CardTitle>
        <CardDescription>Grounded in the selected report</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2">
          <label htmlFor="report-question" className="text-sm font-medium leading-none">
            Question
          </label>
          <Textarea
            id="report-question"
            placeholder="What does the impression mean?"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="min-h-[180px]"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">Answers are grounded in your report only.</p>
          <Button onClick={onAnalyze} disabled={!query || !consentGranted || analyzing}>
            {analyzing ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" data-icon="inline-end" />}
            {analyzing ? "Analyzing" : "Get answer"}
          </Button>
        </div>

        {!consentGranted ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-900">
            Consent is disabled. Enable it in <Link href="/settings" className="underline underline-offset-4">settings</Link> to analyze reports.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReportAnswerCard({ answer, sources }: Pick<ReportDetailGridProps, "answer" | "sources">) {
  if (!answer) return null;

  return (
    <Card className="xl:col-span-2 border-border/60 bg-background">
      <CardHeader>
        <CardTitle className="text-lg">Answer</CardTitle>
        <CardDescription>Evidence-based response</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/80">{answer}</p>
        {sources.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <Badge key={`${source}-${index}`} variant="outline">
                {source}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReportStateNotice({
  report,
}: Pick<ReportDetailGridProps, "report">) {
  if (report.status === "failed") {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <p className="font-medium">Processing failed</p>
        <p className="mt-1">{report.errorMessage ?? "Please try uploading the report again."}</p>
      </div>
    );
  }

  if (report.status === "processing" || report.status === "pending") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Analyzing your report. Please wait…</p>
      </div>
    );
  }

  return null;
}

export function ReportDetailGrid({
  report,
  query,
  answer,
  sources,
  analyzing,
  consentGranted,
  error,
  onQueryChange,
  onAnalyze,
}: ReportDetailGridProps) {
  const isReady = report.status === "ready";

  if (report.status === "failed" || report.status === "processing" || report.status === "pending") {
    return <ReportStateNotice report={report} />;
  }

  return (
    <div className="grid flex-1 gap-6 xl:grid-cols-2">
      <SectionCard icon={FileText} title="Summary" description="At-a-glance overview">
        {isReady && report.summary ? (
          <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/80">{report.summary}</div>
        ) : (
          <p className="text-sm text-muted-foreground">Summary will appear here once processing is complete.</p>
        )}
      </SectionCard>

      <SectionCard icon={Lightbulb} title="Insights" description="Key takeaways from your report">
        {isReady && report.insights ? (
          <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/80">{report.insights}</div>
        ) : (
          <p className="text-sm text-muted-foreground">Insights will appear here once processing is complete.</p>
        )}
      </SectionCard>

      <SectionCard icon={ListChecks} title="Next Actions" description="Recommended steps and questions for your clinician">
        {isReady && report.nextActions ? (
          <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/80">{report.nextActions}</div>
        ) : (
          <p className="text-sm text-muted-foreground">Next actions will appear here once processing is complete.</p>
        )}
      </SectionCard>

      <ReportQuestionCard
        query={query}
        consentGranted={consentGranted}
        analyzing={analyzing}
        onQueryChange={onQueryChange}
        onAnalyze={onAnalyze}
      />

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive xl:col-span-2">
          {error}
        </div>
      ) : null}

      <ReportAnswerCard answer={answer} sources={sources} />
    </div>
  );
}
