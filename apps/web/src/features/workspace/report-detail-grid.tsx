"use client";

import { useState, useMemo } from "react";
import {
  AlertCircle,
  Stethoscope,
  ClipboardList,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";

import type { TrendDataPoint } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TestResultsTable, type TestResult } from "./components/test-results-table";

/* ── Types ───────────────────────────────────────── */

type AbnormalFinding = {
  finding: string;
  explanation: string;
  severity: string;
};

type ParsedData = {
  tests?: TestResult[];
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
        className="flex w-full items-center gap-3 text-left"
        aria-expanded={expanded}
      >
        <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--primary)]/10">
          <Sparkles className="size-4 text-[var(--primary)]" aria-hidden="true" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Ask a question
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            Get plain-language answers about this report
          </span>
        </div>
        <span className="ml-auto text-[var(--muted-foreground)]">
          {expanded ? (
            <ChevronDown className="size-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4" aria-hidden="true" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="mt-5 ml-11 space-y-5">
          {/* Suggested questions */}
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => onQueryChange(q)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    query === q
                      ? "border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "border-[var(--border)]/50 bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30 hover:text-[var(--foreground)]"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="rounded-lg border border-[var(--border)]/40 bg-[var(--card)] p-1.5">
            <div className="flex items-end gap-2">
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
                className="min-h-[44px] resize-none border-0 bg-transparent p-2 text-sm shadow-none focus-visible:ring-0"
              />
              <Button
                onClick={onAnalyze}
                disabled={!query || analyzing}
                className="mb-1.5 mr-1.5 shrink-0"
                size="sm"
              >
                {analyzing ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  "Ask"
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border)]/20 px-2 py-1.5">
              <p className="text-[0.65rem] text-[var(--muted-foreground)]">
                <kbd className="inline-flex h-3.5 items-center rounded border border-[var(--border)] bg-[var(--muted)]/50 px-1 text-[9px] font-medium">
                  ⌘</kbd>
                +{` `}
                <kbd className="inline-flex h-3.5 items-center rounded border border-[var(--border)] bg-[var(--muted)]/50 px-1 text-[9px] font-medium">
                  Enter</kbd>
                {` `}to send
              </p>
              {query && !analyzing && (
                <span className="text-[0.65rem] text-[var(--muted-foreground)]">{query.length} chars</span>
              )}
            </div>
          </div>

          {/* Answer */}
          {answer && (
            <div className="rounded-xl border border-[var(--primary)]/15 bg-[var(--primary)]/[0.04] p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-5 items-center justify-center rounded bg-[var(--primary)]/10">
                  <Sparkles className="size-3 text-[var(--primary)]" aria-hidden="true" />
                </div>
                <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--primary)]">
                  Answer
                </span>
              </div>
              <div className="space-y-3 text-[0.9375rem] leading-relaxed text-[var(--foreground)]">
                {answer.split("\n\n").filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {sources.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-[var(--border)]/30 pt-3">
                  <span className="text-[0.6rem] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    Sources:
                  </span>
                  {sources.map((source, index) => (
                    <span
                      key={`${source}-${index}`}
                      className="inline-flex rounded-md bg-[var(--background)] px-2 py-0.5 text-[0.6rem] font-medium text-[var(--muted-foreground)]"
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

  // Extract parsed data
  const tests = data.tests as TestResult[] | undefined;
  const abnormalFindings = data.abnormal_findings as AbnormalFinding[] | undefined;
  const summary = data.plain_language_summary as string | undefined;
  const doctorImpression = data.doctor_impression as string[] | undefined;
  const recommendations = data.recommendations as string[] | undefined;
  const limitations = data.limitations as string[] | undefined;

  const hasIrregularities = (tests ?? []).some(
    (t) => t.flagged || t.status !== "normal"
  );

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
      {/* ─═ Summary ═─────────────────────────────── */}
      {!hasIrregularities && summary && (
        <section>
          <h2 className="mb-3 flex items-center gap-3 text-sm font-semibold text-[var(--foreground)]">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--primary)]/10">
              <FileText className="size-4 text-[var(--primary)]" aria-hidden="true" />
            </div>
            Summary
          </h2>
          <p className="text-[0.9375rem] leading-relaxed text-[var(--foreground)]">
            {summary}
          </p>
        </section>
      )}

      {/* ─═ Next steps ═──────────────────────────── */}
      {nextSteps.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-3 text-sm font-semibold text-[var(--foreground)]">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--primary)]/10">
              <ClipboardList className="size-4 text-[var(--primary)]" aria-hidden="true" />
            </div>
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
              <h3 className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--muted-foreground)]">
                <AlertCircle className="size-3.5 shrink-0 text-[var(--muted-foreground)]/60" aria-hidden="true" />
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
              <h3 className="mb-3 flex items-center gap-2 text-xs font-medium text-[var(--muted-foreground)]">
                <Stethoscope className="size-3.5 shrink-0 text-[var(--muted-foreground)]/60" aria-hidden="true" />
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
        <TestResultsTable
          tests={tests}
          trends={trends}
          findingExplanations={findingExplanations}
        />
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
