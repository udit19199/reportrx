"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { RangeBar } from "./range-bar";
import { TrendBadge } from "./trend-badge";
import { TrendModal } from "./trend-modal";
import { TrendDataPoint } from "@/lib/api";

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
  { key: "critical", label: "Critical" },
] as const;

export function TestResultsTable({ tests, trends = {} }: TestResultsTableProps) {
  const [filter, setFilter] = useState<string>("all");
  const [trendModal, setTrendModal] = useState<{ testName: string; history: TrendDataPoint[]; current: TestResult } | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return tests;
    if (filter === "flagged") return tests.filter((t) => t.flagged && t.status !== "critical");
    if (filter === "critical") return tests.filter((t) => t.status === "critical");
    if (filter === "normal") return tests.filter((t) => !t.flagged);
    return tests;
  }, [tests, filter]);

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? tests.length
              : f.key === "flagged"
                ? tests.filter((t) => t.flagged && t.status !== "critical").length
                : f.key === "critical"
                  ? tests.filter((t) => t.status === "critical").length
                  : tests.filter((t) => !t.flagged).length;

          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
              <span className="tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60">
              <th className="pb-2 text-left font-medium text-muted-foreground">Test</th>
              <th className="pb-2 text-left font-medium text-muted-foreground">Value</th>
              <th className="pb-2 text-left font-medium text-muted-foreground">Range</th>
              <th className="pb-2 text-left font-medium text-muted-foreground">Status</th>
              <th className="pb-2 text-left font-medium text-muted-foreground">Trend</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted-foreground">
                  No tests match the selected filter.
                </td>
              </tr>
            ) : (
              filtered.map((t, i) => {
                const history = trends[t.test_name] ?? [];
                return (
                  <tr key={i} className="border-b border-border/30">
                    <td className="py-2.5 font-medium">{t.test_name}</td>
                    <td className="py-2.5">
                      <RangeBar value={t.value} referenceRange={t.reference_range} status={t.status} unit={t.unit} />
                    </td>
                    <td className="py-2.5 text-muted-foreground">{t.reference_range}</td>
                    <td className="py-2.5">
                      <Badge
                        variant={
                          t.status === "critical"
                            ? "destructive"
                            : t.flagged
                              ? "default"
                              : "outline"
                        }
                        className={t.status === "normal" ? "text-emerald-600" : ""}
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      {history.length >= 2 && (
                        <TrendBadge
                          history={history}
                          onClick={() => setTrendModal({ testName: t.test_name, history, current: t })}
                        />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
