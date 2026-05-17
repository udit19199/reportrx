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
              aria-pressed={filter === f.key}
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
      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] p-3">Test</TableHead>
              <TableHead className="p-3">Value</TableHead>
              <TableHead className="w-[80px] p-3">Units</TableHead>
              <TableHead className="w-[160px] p-3">Range</TableHead>
              <TableHead className="w-[180px] p-3">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No tests match the selected filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t, i) => {
                const history = trends[t.test_name] ?? [];
                return (
                  <TableRow key={i}>
                    <TableCell className="w-[200px] p-3 whitespace-normal">
                      <span className="flex items-start gap-2 font-medium">
                        <span
                          className="mt-1 size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: resultMarkerColor(t.status) }}
                          aria-hidden="true"
                        />
                        <span>{t.test_name}</span>
                      </span>
                    </TableCell>
                    <TableCell className="p-3">
                      <RangeBar
                        value={t.value}
                        referenceRange={t.reference_range}
                        status={t.status}
                      />
                    </TableCell>
                    <TableCell className="w-[80px] p-3 text-muted-foreground">
                      {t.unit || "—"}
                    </TableCell>
                    <TableCell className="w-[160px] p-3 whitespace-normal text-muted-foreground">
                      {t.reference_range}
                    </TableCell>
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
                        <span className="text-muted-foreground/50">No data</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
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
