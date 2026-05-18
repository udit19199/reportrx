"use client";

import { useMemo } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Minus,
  AlertTriangle,
} from "lucide-react";
import type { ApiReport } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestGlossaryPopover } from "./components/test-glossary-popover";
import { resultDotStyle, getResultColorKey } from "./result-status";

/* ── Types ──────────────────────────────────────── */

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
  plain_language_summary?: string;
  recommendations?: string[];
};

/* ── Helpers ─────────────────────────────────────── */

function extractTests(data: ParsedData | undefined | null): ParsedTest[] {
  return data?.tests ?? [];
}

function getNumericValue(test: ParsedTest): number | null {
  const cleaned = test.value.replace(/[^0-9.\-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

type Delta = "up" | "down" | "stable" | "no_data";

function computeDelta(a: ParsedTest, b: ParsedTest): {
  delta: Delta;
  pctChange: string | null;
} {
  const valA = getNumericValue(a);
  const valB = getNumericValue(b);
  if (valA === null || valB === null || valA === 0) {
    return { delta: "no_data", pctChange: null };
  }
  const diff = valB - valA;
  const pct = (diff / valA) * 100;
  let delta: Delta = "stable";
  if (Math.abs(pct) > 2) {
    delta = pct > 0 ? "up" : "down";
  }
  return { delta, pctChange: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%` };
}

const DeltaIcon = ({ delta }: { delta: Delta }) => {
  if (delta === "up")
    return <ArrowUp className="size-3.5 text-amber-600" aria-hidden="true" />;
  if (delta === "down")
    return <ArrowDown className="size-3.5 text-emerald-600" aria-hidden="true" />;
  return <Minus className="size-3.5 text-[var(--muted-foreground)]" aria-hidden="true" />;
};

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

/* ── Props ───────────────────────────────────────── */

type ReportComparisonProps = {
  reportA: ApiReport;
  reportB: ApiReport;
  onClose: () => void;
};

/* ── Component ───────────────────────────────────── */

export function ReportComparison({
  reportA,
  reportB,
  onClose,
}: ReportComparisonProps) {
  const dataA = reportA.parsedData as ParsedData | undefined;
  const dataB = reportB.parsedData as ParsedData | undefined;
  const testsA = useMemo(() => extractTests(dataA), [dataA]);
  const testsB = useMemo(() => extractTests(dataB), [dataB]);

  const testsAIndex = useMemo(() => {
    const map = new Map<string, ParsedTest>();
    for (const t of testsA) map.set(t.test_name.toLowerCase(), t);
    return map;
  }, [testsA]);

  const testsBIndex = useMemo(() => {
    const map = new Map<string, ParsedTest>();
    for (const t of testsB) map.set(t.test_name.toLowerCase(), t);
    return map;
  }, [testsB]);

  const overlapping = useMemo(() => {
    const common: Array<{ test: ParsedTest; name: string }> = [];
    for (const t of testsA) {
      if (testsBIndex.has(t.test_name.toLowerCase())) {
        common.push({ test: t, name: t.test_name });
      }
    }
    return common;
  }, [testsA, testsBIndex]);

  const uniqueToA = useMemo(
    () => testsA.filter((t) => !testsBIndex.has(t.test_name.toLowerCase())),
    [testsA, testsBIndex]
  );

  const uniqueToB = useMemo(
    () => testsB.filter((t) => !testsAIndex.has(t.test_name.toLowerCase())),
    [testsB, testsAIndex]
  );

  const summaryA = dataA?.plain_language_summary;
  const summaryB = dataB?.plain_language_summary;
  const recsA = dataA?.recommendations;
  const recsB = dataB?.recommendations;

  const hasDiffData =
    overlapping.length > 0 || uniqueToA.length > 0 || uniqueToB.length > 0;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-6 md:px-8 lg:px-12 lg:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-1.5 text-[var(--muted-foreground)]"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back
          </Button>
          <h1 className="text-lg font-display font-medium text-[var(--foreground)]">
            Comparing reports
          </h1>
          <div />
        </div>

        {/* Report meta */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--border)]/40 bg-[var(--card)] px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              Report A
            </p>
            <p className="mt-1 truncate text-sm font-medium text-[var(--foreground)]">
              {reportA.filename}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {formatDate(reportA.uploadedAt)}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)]/40 bg-[var(--card)] px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              Report B
            </p>
            <p className="mt-1 truncate text-sm font-medium text-[var(--foreground)]">
              {reportB.filename}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {formatDate(reportB.uploadedAt)}
            </p>
          </div>
        </div>

        {/* Summaries side by side */}
        {(summaryA || summaryB) && (
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {summaryA && (
              <div className="rounded-lg border border-[var(--border)]/30 bg-[var(--muted)]/30 p-4">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                  {reportA.filename}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--foreground)]">
                  {summaryA}
                </p>
              </div>
            )}
            {summaryB && (
              <div className="rounded-lg border border-[var(--border)]/30 bg-[var(--muted)]/30 p-4">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                  {reportB.filename}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--foreground)]">
                  {summaryB}
                </p>
              </div>
            )}
          </div>
        )}

        {/* No test data */}
        {!hasDiffData && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertTriangle className="size-5 text-[var(--muted-foreground)]/40" aria-hidden="true" />
            <p className="text-sm text-[var(--muted-foreground)]">
              No test data available to compare.
            </p>
          </div>
        )}

        {/* Overlapping tests comparison table */}
        {overlapping.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-base font-medium text-[var(--foreground)]">
              {overlapping.length} overlapping test{overlapping.length > 1 ? "s" : ""}
            </h2>
            <div className="overflow-hidden rounded-lg border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                    <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                      Test
                    </th>
                    <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                      {reportA.filename}
                    </th>
                    <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                      {reportB.filename}
                    </th>
                    <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overlapping.map(({ test, name }) => {
                    const matchB = testsBIndex.get(name.toLowerCase());
                    const delta = matchB
                      ? computeDelta(test, matchB)
                      : { delta: "no_data" as Delta, pctChange: null };
                    const refRange =
                      test.reference_range ||
                      matchB?.reference_range ||
                      "—";

                    return (
                      <tr
                        key={name}
                        className="border-b border-[var(--border)]/40 last:border-b-0"
                      >
                        <td className="p-3 whitespace-normal">
                          <TestGlossaryPopover testName={name} />
                          <br />
                          <span className="text-[0.65rem] text-[var(--muted-foreground)]">
                            Ref: {refRange}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <TestValueCell test={test} unit={test.unit} />
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {matchB ? (
                            <TestValueCell test={matchB} unit={matchB.unit} />
                          ) : (
                            <span className="text-[var(--muted-foreground)]">—</span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <DeltaIcon delta={delta.delta} />
                            {delta.pctChange && (
                              <span className="text-xs text-[var(--muted-foreground)]">
                                {delta.pctChange}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Unique tests grids */}
        <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {uniqueToA.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                Only in {reportA.filename}
              </h3>
              <ul className="space-y-1.5">
                {uniqueToA.map((t) => (
                  <li
                    key={t.test_name}
                    className="flex items-center gap-2 rounded-lg border border-[var(--border)]/30 px-3 py-2 text-sm"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={resultDotStyle(t.status)}
                      aria-hidden
                    />
                    <TestGlossaryPopover testName={t.test_name} />
                    <span className="ml-auto text-[var(--muted-foreground)]">
                      {t.value} {t.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {uniqueToB.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                Only in {reportB.filename}
              </h3>
              <ul className="space-y-1.5">
                {uniqueToB.map((t) => (
                  <li
                    key={t.test_name}
                    className="flex items-center gap-2 rounded-lg border border-[var(--border)]/30 px-3 py-2 text-sm"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={resultDotStyle(t.status)}
                      aria-hidden
                    />
                    <TestGlossaryPopover testName={t.test_name} />
                    <span className="ml-auto text-[var(--muted-foreground)]">
                      {t.value} {t.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Inline test value cell ──────────────────────── */

function TestValueCell({ test, unit }: { test: ParsedTest; unit: string }) {
  const isAbnormal = test.status !== "normal";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`font-medium tabular-nums ${
          isAbnormal ? "text-amber-700 dark:text-amber-400" : ""
        }`}
      >
        {test.value} {unit}
      </span>
      {isAbnormal && (
        <span
          className="size-2 rounded-full"
          style={resultDotStyle(test.status)}
          aria-hidden
        />
      )}
    </span>
  );
}
