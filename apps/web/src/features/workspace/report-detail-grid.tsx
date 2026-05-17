"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Stethoscope,
  ClipboardList,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";

import type { TrendDataPoint } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TestResultsTable, type TestResult } from "./components/test-results-table";
import { RangeBar } from "./components/range-bar";
import { ResultStatusLegend } from "./components/result-status-legend";
import {
  resultDotStyle,
  resultRowAccentClass,
  sortByResultSeverity,
} from "./result-status";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ── Types ───────────────────────────────────────── */

type AbnormalFinding = {
  finding: string;
  explanation: string;
  severity: string;
};

type ParsedTest = {
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  flagged: boolean;
  status: string;
};

type ParsedData = {
  tests?: ParsedTest[];
  abnormal_findings?: AbnormalFinding[];
  doctor_impression?: string[];
  recommendations?: string[];
  critical_alerts?: string[];
  plain_language_summary?: string;
  limitations?: string[];
};

type ReportDetailGridProps = {
  data: Record<string, unknown>;
  trends?: Record<string, TrendDataPoint[]>;
  showFullData: boolean;
  query: string;
  consentGranted: boolean;
  analyzing: boolean;
  answer: string | null;
  sources: string[];
  onQueryChange: (value: string) => void;
  onAnalyze: () => void;
};

function impactFallback(test: ParsedTest) {
  if (test.status === "high" || test.status === "critical") {
    return "Above the expected range.";
  }
  if (test.status === "low") return "Below the expected range.";
  return "Outside the expected range.";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Keep only the clinical impact — strip value/range restatements from AI text. */
function getImpactText(explanation: string | undefined, test: ParsedTest) {
  if (!explanation?.trim()) return impactFallback(test);

  const whichMatch = explanation.match(/,?\s*which\s+(.+)$/i);
  if (whichMatch) {
    const clause = whichMatch[1].trim().replace(/\.$/, "");
    if (clause.length > 12) {
      return clause.charAt(0).toUpperCase() + clause.slice(1) + ".";
    }
  }

  let text = explanation.trim();
  const valuePattern = escapeRegExp(test.value);
  const rangePattern = escapeRegExp(test.reference_range);

  text = text
    .replace(new RegExp(`\\(?\\s*normal range:?\\s*${rangePattern}\\s*\\)?`, "gi"), "")
    .replace(new RegExp(`\\b${valuePattern}\\b`, "g"), "")
    .replace(
      /\b(is|was)\s+(elevated|high|low|decreased|increased)\s+(at|to)?\s*/gi,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .replace(/^[,.\s]+|[,.\s]+$/g, "")
    .trim();

  if (text.length < 20) return impactFallback(test);
  return text.endsWith(".") ? text : `${text}.`;
}

/* ── Q&A Section ─────────────────────────────────── */

const SUGGESTED_QUESTIONS = [
  "What do my abnormal results mean?",
  "Summarize this report",
  "What should I ask my doctor?",
];

function QASection({
  expanded,
  query,
  consentGranted,
  analyzing,
  answer,
  sources,
  onToggle,
  onQueryChange,
  onAnalyze,
}: {
  expanded: boolean;
  query: string;
  consentGranted: boolean;
  analyzing: boolean;
  answer: string | null;
  sources: string[];
  onToggle: () => void;
  onQueryChange: (value: string) => void;
  onAnalyze: () => void;
}) {
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  const handleAsk = () => {
    if (!consentGranted) {
      setShowConsentDialog(true);
      return;
    }
    onAnalyze();
  };

  return (
    <div className="border-t border-[var(--border)]/30 pt-6">
      {/* Collapse trigger */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 text-left"
      >
        <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--primary)]/8">
          <Sparkles className="size-3.5 text-[var(--primary)]" />
        </div>
        <span className="text-sm font-medium text-[var(--foreground)]">
          Ask about this report
        </span>
        <span className="ml-auto text-[var(--muted-foreground)]">
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Suggested questions */}
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => onQueryChange(q)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  query === q
                    ? "border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-[var(--border)]/50 bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                }`}
              >
                <Sparkles className="size-3" />
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="What does the impression mean?"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && query && !analyzing) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              className="min-h-[44px] resize-none border-[var(--border)]/50 bg-[var(--background)] text-sm"
            />
            <Button
              onClick={handleAsk}
              disabled={!query || analyzing}
              className="shrink-0 self-end"
            >
              {analyzing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Ask"
              )}
            </Button>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            <kbd className="inline-flex h-4 items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--muted)]/50 px-1 text-[10px] font-medium">
              ⌘
            </kbd>
            +{` `}
            <kbd className="inline-flex h-4 items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--muted)]/50 px-1 text-[10px] font-medium">
              Enter
            </kbd>
            {` `}to submit
          </p>

          {/* Answer */}
          {answer && (
            <div className="rounded-xl border-l-4 border-l-[var(--primary)] bg-[var(--muted)]/40 p-5">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="size-4 text-[var(--primary)]" />
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--primary)]">
                  AI Response
                </span>
              </div>
              <div className="space-y-3 text-[0.9375rem] leading-relaxed text-[var(--foreground)]">
                {answer.split("\n\n").filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {sources.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--border)]/40 pt-3">
                  {sources.map((source, index) => (
                    <span
                      key={`${source}-${index}`}
                      className="inline-flex rounded bg-[var(--background)] px-2 py-0.5 text-[0.65rem] text-[var(--muted-foreground)]"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Processing Required</DialogTitle>
            <DialogDescription>
              To analyze reports and answer questions, you need to enable AI processing consent in your settings.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConsentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => { setShowConsentDialog(false); window.location.href = "/settings"; }}>
              Go to Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Main Component ───────────────────────────────── */

export function ReportDetailGrid({
  data,
  trends,
  showFullData,
  query,
  consentGranted,
  analyzing,
  answer,
  sources,
  onQueryChange,
  onAnalyze,
}: ReportDetailGridProps) {
  const [qaExpanded, setQaExpanded] = useState(false);

  // Extract parsed data
  const tests = data.tests as ParsedTest[] | undefined;
  const abnormalFindings = data.abnormal_findings as AbnormalFinding[] | undefined;
  const summary = data.plain_language_summary as string | undefined;
  const doctorImpression = data.doctor_impression as string[] | undefined;
  const recommendations = data.recommendations as string[] | undefined;
  const limitations = data.limitations as string[] | undefined;

  // Flagged tests
  const flaggedTests = useMemo(
    () =>
      sortByResultSeverity(
        (tests ?? []).filter((t) => t.flagged || t.status !== "normal")
      ),
    [tests]
  );

  const hasIrregularities = flaggedTests.length > 0;

  // Build a lookup: finding name → explanation
  const findingExplanations = useMemo(() => {
    const map = new Map<string, { explanation: string; severity: string }>();
    for (const f of abnormalFindings ?? []) {
      map.set(f.finding.toLowerCase(), {
        explanation: f.explanation,
        severity: f.severity,
      });
    }
    return map;
  }, [abnormalFindings]);

  return (
    <div className="flex flex-col gap-8">
      {!hasIrregularities && summary && (
        <div>
          <p className="text-[1rem] leading-relaxed text-[var(--foreground)]">
            {summary}
          </p>
        </div>
      )}

      {/* ─═ Flagged Results ═─────────────────────── */}
      {flaggedTests.length > 0 && (
        <section>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-medium text-[var(--foreground)]">
              {flaggedTests.length} result{flaggedTests.length > 1 ? "s" : ""} need attention
            </h2>
            <ResultStatusLegend />
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <div className="hidden border-b border-[var(--border)] bg-[var(--muted)]/40 px-4 py-2 text-[0.65rem] font-medium uppercase tracking-wider text-[var(--muted-foreground)] md:grid md:grid-cols-[minmax(0,1fr)_minmax(220px,1.15fr)_minmax(0,1.35fr)] md:gap-x-6">
              <span>Test</span>
              <span>Your result vs normal</span>
              <span>What it may mean</span>
            </div>

            {flaggedTests.map((test, i) => {
              const finding = findingExplanations.get(test.test_name.toLowerCase());
              const impact = getImpactText(finding?.explanation, test);

              return (
                <div
                  key={i}
                  className={`grid grid-cols-1 gap-x-6 gap-y-2 border-b border-[var(--border)]/50 px-4 py-2.5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(220px,1.15fr)_minmax(0,1.35fr)] md:items-center md:gap-y-0 ${resultRowAccentClass(test.status)}`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={resultDotStyle(test.status)}
                      aria-hidden
                    />
                    <span className="truncate text-sm font-medium text-[var(--foreground)]">
                      {test.test_name}
                    </span>
                  </div>

                  <RangeBar
                    variant="inline"
                    value={test.value}
                    referenceRange={test.reference_range}
                    status={test.status}
                  />

                  <p className="text-sm leading-snug text-[var(--muted-foreground)] md:border-l md:border-[var(--border)]/40 md:pl-6">
                    {impact}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─═ Two-Column: Recommendations + Notes ════ */}
      {(recommendations && recommendations.length > 0) ||
      (doctorImpression && doctorImpression.length > 0) ||
      (abnormalFindings && abnormalFindings.length > 0) ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {/* Left: Recommendations + Limitations */}
          <div className="space-y-6">
            {recommendations && recommendations.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                  <ClipboardList className="size-3.5" />
                  What to do
                </h3>
                <ul className="space-y-2">
                  {recommendations.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm leading-relaxed text-[var(--foreground)]"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--primary)]/40" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {limitations && limitations.length > 0 && (
              <div className="rounded-lg border border-[var(--border)]/30 bg-[var(--muted)]/30 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                  <AlertCircle className="size-3.5" />
                  Limitations
                </h3>
                <ul className="space-y-1">
                  {limitations.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]"
                    >
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--muted-foreground)]/30" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: Doctor's Impression (sticky) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-6">
              {doctorImpression && doctorImpression.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    <Stethoscope className="size-3.5" />
                    Doctor&apos;s notes
                  </h3>
                  <div className="space-y-3">
                    {doctorImpression.map((item, i) => (
                      <p
                        key={i}
                        className="text-sm leading-relaxed text-[var(--foreground)]"
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {abnormalFindings && abnormalFindings.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    <AlertTriangle className="size-3.5" />
                    Abnormal findings
                  </h3>
                  <div className="space-y-3">
                    {abnormalFindings.map((f, i) => {
                      // Skip findings already shown in flagged results
                      if (flaggedTests.some(
                        (t) => t.test_name.toLowerCase() === f.finding.toLowerCase()
                      )) return null;

                      return (
                        <div
                          key={i}
                          className={`rounded-lg border border-[var(--border)]/30 px-3 py-2.5 ${resultRowAccentClass(f.severity)}`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={resultDotStyle(f.severity)}
                              aria-hidden
                            />
                            <span className="text-sm font-medium text-[var(--foreground)]">
                              {f.finding}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            {f.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ─═ Full Data (toggled) ═────────────────────── */}
      {showFullData && tests && tests.length > 0 && (
        <section className="border-t border-[var(--border)]/30 pt-6">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            All test results
          </h3>
          <TestResultsTable
            tests={tests as unknown as TestResult[]}
            trends={trends}
          />
        </section>
      )}

      {/* ─═ Q&A ═────────────────────────────────────── */}
      <QASection
        expanded={qaExpanded}
        query={query}
        consentGranted={consentGranted}
        analyzing={analyzing}
        answer={answer}
        sources={sources}
        onToggle={() => setQaExpanded(!qaExpanded)}
        onQueryChange={onQueryChange}
        onAnalyze={onAnalyze}
      />
    </div>
  );
}
