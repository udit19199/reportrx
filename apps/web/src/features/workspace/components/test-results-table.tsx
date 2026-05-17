"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { RangeBar } from "./range-bar";
import { ResultStatusLegend } from "./result-status-legend";
import { TrendBadge } from "./trend-badge";
import {
  resultMarkerColor,
  sortByResultSeverity,
} from "../result-status";
import type { TrendDataPoint } from "@/lib/api";

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

export type TestResult = {
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  flagged: boolean;
  status: string;
};

type TestResultsTableProps = {
  tests: TestResult[];
  trends?: Record<string, TrendDataPoint[]>;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "normal", label: "Normal" },
  { key: "flagged", label: "Flagged" },
] as const;

export function TestResultsTable({
  tests,
  trends = {},
}: TestResultsTableProps) {
  const [filter, setFilter] = useState<string>("all");
  const [trendModal, setTrendModal] = useState<{
    testName: string;
    history: TrendDataPoint[];
    current: TestResult;
  } | null>(null);

  const filtered = useMemo(() => {
    let list = tests;
    if (filter === "flagged") {
      list = tests.filter((t) => t.flagged || t.status !== "normal");
    } else if (filter === "normal") {
      list = tests.filter((t) => t.status === "normal" && !t.flagged);
    }
    return sortByResultSeverity(list);
  }, [tests, filter]);

  return (
    <>
      <ResultStatusLegend className="mb-4" />

      {/* Filter buttons */}
      <div className="mb-4 flex items-center gap-2">
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? tests.length
              : f.key === "flagged"
                ? tests.filter((t) => t.flagged || t.status !== "normal").length
                : tests.filter((t) => t.status === "normal" && !t.flagged).length;

          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)]/60 bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              {f.label}
              <span className="tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]/40">
              <th className="pb-2.5 text-left text-xs font-medium text-[var(--muted-foreground)]">
                Test
              </th>
              <th className="pb-2.5 text-left text-xs font-medium text-[var(--muted-foreground)]">
                Value
              </th>
              <th className="pb-2.5 text-left text-xs font-medium text-[var(--muted-foreground)]">
                Units
              </th>
              <th className="pb-2.5 text-left text-xs font-medium text-[var(--muted-foreground)]">
                Range
              </th>
              <th className="pb-2.5 text-left text-xs font-medium text-[var(--muted-foreground)]">
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-sm text-[var(--muted-foreground)]"
                >
                  No tests match the selected filter.
                </td>
              </tr>
            ) : (
              filtered.map((t, i) => {
                const history = trends[t.test_name] ?? [];
                return (
                  <tr
                    key={i}
                    className="border-b border-[var(--border)]/20 transition-colors hover:bg-[var(--muted)]/30"
                  >
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: resultMarkerColor(t.status) }}
                          aria-hidden
                        />
                        {t.test_name}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <RangeBar
                        value={t.value}
                        referenceRange={t.reference_range}
                        status={t.status}
                      />
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-[var(--muted-foreground)]">
                      {t.unit}
                    </td>
                    <td className="py-2.5 pr-3 text-sm text-[var(--muted-foreground)]">
                      {t.reference_range}
                    </td>
                    <td className="py-2.5">
                      {history.length >= 2 && (
                        <button
                          onClick={() =>
                            setTrendModal({
                              testName: t.test_name,
                              history,
                              current: t,
                            })
                          }
                          className="group flex items-center gap-2"
                        >
                          <MiniSparkline
                            data={history}
                            color={resultMarkerColor(t.status)}
                          />
                          <TrendBadge history={history} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
