"use client";

import { useState } from "react";
import type { TrendDataPoint } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResultStatusLegend } from "@/features/workspace/components/result-status-legend";
import { resultMarkerColor } from "@/features/workspace/result-status";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

type TrendsClientProps = {
  initialData: Record<string, TrendDataPoint[]>;
};

/* ── Helpers ─────────────────────────────────────── */

function parseRange(range: string | null): { min: number; max: number } | null {
  if (!range) return null;
  const match = range.match(/([0-9.]+)\s*[-–—to]+\s*([0-9.]+)/i);
  if (!match) return null;
  return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
}

function computeTrend(history: TrendDataPoint[]): "up" | "down" | "stable" | null {
  if (history.length < 2) return null;
  const numericValues = history
    .map((h) => parseFloat(h.value?.replace(/[^0-9.-]/g, "") ?? ""))
    .filter((v) => !isNaN(v));
  if (numericValues.length < 2) return null;
  const recent = numericValues.slice(-2);
  const diff = recent[1] - recent[0];
  const pctChange = Math.abs(diff) / Math.abs(recent[0]);
  if (pctChange < 0.02) return "stable";
  return diff > 0 ? "up" : "down";
}

/* ── Sparkline Card ──────────────────────────────── */

function SparklineCard({
  testName,
  history,
  onClick,
}: {
  testName: string;
  history: TrendDataPoint[];
  onClick: () => void;
}) {
  const trend = computeTrend(history);
  const range = parseRange(history[0]?.referenceRange ?? null);
  const unit = history[0]?.unit ?? "";

  const chartData = history.map((h) => {
    const numValue = parseFloat(h.value?.replace(/[^0-9.-]/g, "") ?? "");
    return {
      date: new Date(h.uploadedAt).toLocaleDateString("en-US"),
      value: isNaN(numValue) ? null : numValue,
      status: h.status,
    };
  });

  const TrendIcon = trend === "up" ? TrendingUp
    : trend === "down" ? TrendingDown
    : Minus;

  const trendColor = trend === "up" || trend === "down"
    ? "text-amber-600 dark:text-amber-400"
    : "text-emerald-600 dark:text-emerald-400";

  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all duration-200 hover:-translate-y-0.5"
    >
      <Card className="p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[var(--primary)]/30">
        <div className="mb-3 flex items-center justify-between">
          <p className="truncate text-sm font-medium text-[var(--foreground)]">
            {testName}
          </p>
          {trend && (
            <TrendIcon className={`size-3.5 shrink-0 ml-2 ${trendColor}`} />
          )}
        </div>
        <div className="mb-2 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.86 0.01 60 / 0.3)"
              />
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["auto", "auto"]} />
              {range && (
                <ReferenceArea
                  y1={range.min}
                  y2={range.max}
                  fill="oklch(0.33 0.055 155 / 0.06)"
                  stroke="none"
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="oklch(0.33 0.055 155)"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>
            {history.length} measurement{history.length !== 1 ? "s" : ""}
          </span>
          {history.length > 0 && (
            <span>
              {history[history.length - 1]?.value} {unit}
            </span>
          )}
        </div>
      </Card>
    </button>
  );
}

/* ── Detailed Chart ──────────────────────────────── */

function DetailedChart({
  testName,
  history,
  onBack,
}: {
  testName: string;
  history: TrendDataPoint[];
  onBack: () => void;
}) {
  const range = parseRange(history[0]?.referenceRange ?? null);
  const unit = history[0]?.unit ?? "";

  const chartData = history.map((h) => {
    const numValue = parseFloat(h.value?.replace(/[^0-9.-]/g, "") ?? "");
    return {
      date: new Date(h.uploadedAt).toLocaleDateString("en-US"),
      value: isNaN(numValue) ? null : numValue,
      filename: h.filename,
      status: h.status,
    };
  });

  const statusColor = (status: string) => resultMarkerColor(status);

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 gap-1 text-[var(--muted-foreground)]"
      >
        <ArrowLeft className="size-3.5" />
        Back to all tests
      </Button>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">{testName}</CardTitle>
              <CardDescription>
                {history.length} measurement
                {history.length !== 1 ? "s" : ""} · {unit}
              </CardDescription>
            </div>
            {range && (
              <Badge variant="outline" className="text-[var(--muted-foreground)]">
                Normal: {range.min}–{range.max} {unit}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.86 0.01 60 / 0.4)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="oklch(0.50 0.02 65)"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="oklch(0.50 0.02 65)"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const point = payload[0].payload;
                    return (
                      <Card className="px-3 py-2 text-xs shadow-sm">
                        <p className="font-medium text-[var(--foreground)]">
                          {point.date}
                        </p>
                        <p className="mt-0.5 text-[var(--muted-foreground)]">
                          Value: {point.value} {unit}
                        </p>
                      </Card>
                    );
                  }}
                />
                {range && (
                  <ReferenceArea
                    y1={range.min}
                    y2={range.max}
                    fill="oklch(0.33 0.055 155 / 0.08)"
                    stroke="none"
                    label={{
                      value: "Normal range",
                      position: "insideTopRight",
                      fontSize: 11,
                      fill: "oklch(0.50 0.02 65)",
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="oklch(0.33 0.055 155)"
                  strokeWidth={2}
                  dot={({ cx, cy, payload }) => (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={statusColor(payload.status)}
                      stroke="oklch(0.99 0.004 70)"
                      strokeWidth={2}
                    />
                  )}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--muted)]/50"
              >
                <span className="text-[var(--muted-foreground)]">
                  {new Date(h.uploadedAt).toLocaleDateString("en-US")}
                </span>
                <span className="font-medium text-[var(--foreground)]">
                  {h.value} {h.unit}
                </span>
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: resultMarkerColor(h.status) }}
                  title={
                    h.status === "normal"
                      ? "In range"
                      : h.status === "low"
                        ? "Below range"
                        : "Above range"
                  }
                  aria-hidden
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Trends Client ─────────────────────────────────── */

export function TrendsClient({ initialData }: TrendsClientProps) {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  const testsWithHistory = Object.entries(initialData).filter(
    ([, history]) => history.length >= 2
  );

  /* ── Empty State ─────────────────────────────────── */
  if (testsWithHistory.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 lg:px-8">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--muted)]">
            <FileText className="size-7 text-[var(--muted-foreground)]/50" />
          </div>
          <h2 className="mt-5 text-lg font-display font-medium text-[var(--foreground)]">
            No trends available yet
          </h2>
          <p className="mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
            Upload 2 or more reports of the same type (e.g., blood tests) to
            start seeing trends over time.
          </p>
        </div>
      </div>
    );
  }

  /* ── Main View ───────────────────────────────────── */
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 lg:px-8">
      {selectedTest && initialData[selectedTest] ? (
        <DetailedChart
          testName={selectedTest}
          history={initialData[selectedTest]}
          onBack={() => setSelectedTest(null)}
        />
      ) : (
        <div>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--primary)]/10">
                <Sparkles className="size-4.5 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-xl font-display font-medium text-[var(--foreground)]">
                  Trends
                </h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Track your test results across multiple reports
                </p>
              </div>
            </div>
            <ResultStatusLegend />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testsWithHistory.map(([testName, history]) => (
              <SparklineCard
                key={testName}
                testName={testName}
                history={history}
                onClick={() => setSelectedTest(testName)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
