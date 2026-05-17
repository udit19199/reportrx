"use client";

import { useState, useMemo } from "react";
import {
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
  sortByResultSeverity,
} from "./result-status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  query: string;
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
  analyzing,
  answer,
  sources,
  onToggle,
  onQueryChange,
  onAnalyze,
}: {
  expanded: boolean;
  query: string;
  analyzing: boolean;
  answer: string | null;
  sources: string[];
  onToggle: () => void;
  onQueryChange: (value: string) => void;
  onAnalyze: () => void;
}) {
  return (
    <div className="border-t border-[var(--border)]/30 pt-6">
      {/* Collapse trigger */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={expanded}
      >
        <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--primary)]/8">
          <Sparkles className="size-3.5 text-[var(--primary)]" aria-hidden="true" />
        </div>
        <span className="text-sm font-medium text-[var(--foreground)]">
          Ask about this report
        </span>
        <span className="ml-auto text-[var(--muted-foreground)]">
          {expanded ? (
            <ChevronDown className="size-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4" aria-hidden="true" />
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
                <Sparkles className="size-3" aria-hidden="true" />
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="What does the impression mean?…"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && query && !analyzing) {
                  e.preventDefault();
                  onAnalyze();
                }
              }}
              className="min-h-[44px] resize-none border-[var(--border)]/50 bg-[var(--background)] text-sm"
            />
            <Button
              onClick={onAnalyze}
              disabled={!query || analyzing}
              className="shrink-0 self-end"
            >
              {analyzing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
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
                <Sparkles className="size-4 text-[var(--primary)]" aria-hidden="true" />
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
    </div>
  );
}

/* ── Main Component ───────────────────────────────── */

export function ReportDetailGrid({
  data,
  trends,
  query,
  analyzing,
  answer,
  sources,
  onQueryChange,
  onAnalyze,
}: ReportDetailGridProps) {
  const [qaExpanded, setQaExpanded] = useState(false);
  const [showFullData, setShowFullData] = useState(false);

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

  const nextSteps = useMemo(
    () => (recommendations ?? []).filter((item) => item?.trim()),
    [recommendations]
  );

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
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-medium text-[var(--foreground)]">
              {flaggedTests.length} result{flaggedTests.length > 1 ? "s" : ""} need attention
            </h2>
            <ResultStatusLegend />
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] p-3">Test</TableHead>
                  <TableHead className="p-3">Your result vs normal</TableHead>
                  <TableHead className="w-[40%] p-3">What it may mean</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flaggedTests.map((test, i) => {
                  const finding = findingExplanations.get(test.test_name.toLowerCase());
                  const impact = getImpactText(finding?.explanation, test);

                  return (
                    <TableRow key={i}>
                      <TableCell className="p-3 whitespace-normal">
                        <span className="flex items-start gap-2.5">
                          <span
                            className="mt-1 size-2.5 shrink-0 rounded-full"
                            style={resultDotStyle(test.status)}
                            aria-hidden
                          />
                          <span className="font-medium">{test.test_name}</span>
                        </span>
                      </TableCell>
                      <TableCell className="p-3">
                        <RangeBar
                          variant="inline"
                          value={test.value}
                          referenceRange={test.reference_range}
                          status={test.status}
                          unit={test.unit}
                        />
                      </TableCell>
                      <TableCell className="border-l border-[var(--border)]/40 p-3 whitespace-normal leading-relaxed text-[var(--muted-foreground)]">
                        {impact}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* ─═ Next steps ═──────────────────────────── */}
      {nextSteps.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
            <ClipboardList className="size-4 text-[var(--primary)]" aria-hidden="true" />
            Next steps
          </h2>
          <ul className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
            {nextSteps.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm leading-relaxed text-[var(--foreground)]"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--primary)]/40" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            <strong>Disclaimer:</strong> These suggestions are AI-generated and should not replace professional medical advice. Always consult a qualified healthcare provider before making any health-related decisions.
          </p>
        </section>
      )}

      {/* ─═ Limitations + doctor's notes ═══════════ */}
      {(limitations && limitations.length > 0) ||
      (doctorImpression && doctorImpression.length > 0) ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {limitations && limitations.length > 0 && (
            <div className="rounded-lg border border-[var(--border)]/30 bg-[var(--muted)]/30 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                <AlertCircle className="size-3.5" aria-hidden="true" />
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

          {doctorImpression && doctorImpression.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                <Stethoscope className="size-3.5" aria-hidden="true" />
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
        </div>
      ) : null}

      {tests && tests.length > 0 && (
        <section className="border-t border-[var(--border)]/30 pt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              All test results
            </h3>
            <button
              type="button"
              onClick={() => setShowFullData((v) => !v)}
              className="text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              {showFullData ? "Hide table" : "Show all results"}
            </button>
          </div>
          {showFullData && (
            <TestResultsTable
              tests={tests as unknown as TestResult[]}
              trends={trends}
            />
          )}
        </section>
      )}

      {/* ─═ Q&A ═────────────────────────────────────── */}
      <QASection
        expanded={qaExpanded}
        query={query}
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
