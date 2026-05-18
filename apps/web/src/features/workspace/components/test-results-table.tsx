"use client";

import { useMemo, useState } from "react";
import { TestGlossaryPopover } from "./test-glossary-popover";
import dynamic from "next/dynamic";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { RangeBar } from "./range-bar";
import { ResultStatusLegend } from "./result-status-legend";
import { TrendBadge } from "./trend-badge";
import {
  resultMarkerColor,
  sortByResultSeverity,
  getImpactText,
} from "../result-status";
import { getTestExplanation } from "../medical-glossary";
import type { TrendDataPoint } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TrendModal = dynamic(
  () => import("./trend-modal").then((mod) => mod.TrendModal),
  { ssr: false }
);

/* ── Mini Sparkline ───────────────────────────────── */

function MiniSparkline({
  data,
  color = "var(--result-normal)",
}: {
  data: TrendDataPoint[];
  color?: string;
}) {
  const chartData = useMemo(() => {
    return data
      .map((d) => ({
        value: parseFloat(d.value?.replace(/[^0-9.-]/g, "") ?? ""),
      }))
      .filter((d) => !isNaN(d.value));
  }, [data]);

  if (chartData.length < 2) return null;

  return (
    <div className="h-6 w-16 shrink-0 overflow-hidden">
      <ResponsiveContainer width={64} height={24}>
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Types ────────────────────────────────────────── */

import type { CatalogRange } from "./range-bar";

export type TestResult = {
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  flagged: boolean;
  status: string;
  catalog_range?: CatalogRange | null;
};

type TestResultsTableProps = {
  tests: TestResult[];
  trends?: Record<string, TrendDataPoint[]>;
  /** Lookup: lowercase test name → { explanation, severity } for the "What it may mean" column. */
  findingExplanations?: Map<string, { explanation: string; severity: string }>;
};

/* ── Component ────────────────────────────────────── */

export function TestResultsTable({
  tests,
  trends = {},
  findingExplanations,
}: TestResultsTableProps) {
  const [showCritical, setShowCritical] = useState(true);
  const [trendModal, setTrendModal] = useState<{
    testName: string;
    history: TrendDataPoint[];
    current: TestResult;
  } | null>(null);

  const criticalCount = useMemo(
    () => tests.filter((t) => t.flagged || t.status !== "normal").length,
    [tests]
  );

  const hasAnyTrend = useMemo(
    () => tests.some((t) => (trends[t.test_name]?.length ?? 0) >= 2),
    [tests, trends]
  );

  const filtered = useMemo(() => {
    let list = tests;
    if (showCritical) {
      list = tests.filter((t) => t.flagged || t.status !== "normal");
    }
    return sortByResultSeverity(list);
  }, [tests, showCritical]);

  const colSpan = hasAnyTrend ? 4 : 3;

  return (
    <>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        {/* All / Critical toggle */}
        <div className="flex items-center gap-2">
        <button
          onClick={() => setShowCritical(false)}
          aria-pressed={!showCritical}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            !showCritical
              ? "border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]"
              : "border-[var(--border)]/60 bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          }`}
        >
          All
          <span className="tabular-nums opacity-70">{tests.length}</span>
        </button>
        <button
          onClick={() => setShowCritical(true)}
          aria-pressed={showCritical}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            showCritical
              ? "border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]"
              : "border-[var(--border)]/60 bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          }`}
        >
          Critical
          <span className="tabular-nums opacity-70">{criticalCount}</span>
        </button>
        </div>
        <ResultStatusLegend className="gap-x-3 text-xs" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[240px] p-3">Test</TableHead>
              <TableHead className="p-3">Your result</TableHead>
              {hasAnyTrend && (
                <TableHead className="w-[180px] p-3">Trend</TableHead>
              )}
              <TableHead className="w-[25%] p-3">What it may mean</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="py-8 text-center text-muted-foreground"
                >
                  No tests match the selected filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t, i) => {
                const history = trends[t.test_name] ?? [];
                const finding = findingExplanations?.get(
                  t.test_name.toLowerCase()
                );
                const impact = getImpactText(finding?.explanation, t);
                const explanation = getTestExplanation(t.test_name);

                return (
                  <TableRow key={i}>
                    <TableCell className="w-[240px] min-w-[180px] p-3 whitespace-normal break-words hyphens-auto align-top">
                      <span className="flex items-start gap-2">
                        <span
                          className="mt-1.5 size-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: resultMarkerColor(t.status),
                          }}
                          aria-hidden="true"
                        />
                        <TestGlossaryPopover testName={t.test_name} />
                      </span>
                    </TableCell>
                    <TableCell className="p-3">
                      <RangeBar
                        variant="inline"
                        value={t.value}
                        referenceRange={t.reference_range}
                        status={t.status}
                        unit={t.unit}
                        tooltipText={explanation}
                        catalogRange={t.catalog_range}
                      />
                    </TableCell>
                    {hasAnyTrend && (
                      <TableCell className="w-[180px] p-3">
                        {history.length >= 2 ? (
                          <button
                            onClick={() =>
                              setTrendModal({
                                testName: t.test_name,
                                history,
                                current: t,
                              })
                            }
                            aria-label={`View trend history for ${t.test_name}`}
                            className="group flex items-center gap-2"
                          >
                            <MiniSparkline
                              data={history}
                              color={resultMarkerColor(t.status)}
                            />
                            <TrendBadge history={history} />
                          </button>
                        ) : (
                          <span className="text-muted-foreground/50">
                            No data
                          </span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="border-l border-[var(--border)]/40 p-3 whitespace-normal leading-relaxed text-[var(--muted-foreground)]">
                      {impact}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Empty trends notice */}
        {!hasAnyTrend && tests.length > 0 && (
          <div className="border-t border-[var(--border)]/40 px-3 py-2.5 text-center text-xs text-[var(--muted-foreground)]/50">
            Trends will appear after you upload 2 or more reports with the same test.
          </div>
        )}
      </div>

      {/* Trend Modal */}
      {trendModal && (
        <TrendModal
          open={!!trendModal}
          onOpenChange={(open) => !open && setTrendModal(null)}
          testName={trendModal.testName}
          history={trendModal.history}
          currentReport={{
            filename: "",
            uploadedAt: "",
            value: trendModal.current.value,
            unit: trendModal.current.unit,
            referenceRange: trendModal.current.reference_range,
            status: trendModal.current.status,
          }}
        />
      )}
    </>
  );
}
