"use client";

import { useEffect, useState } from "react";
import { api, type TrendDataPoint } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, TrendingDown, Minus, ArrowLeft } from "lucide-react";
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

type TrendsData = Record<string, TrendDataPoint[]>;

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
      date: new Date(h.uploadedAt).toLocaleDateString(),
      value: isNaN(numValue) ? null : numValue,
      status: h.status,
    };
  });

  const trendConfig = {
    up: { icon: TrendingUp, color: "text-amber-600 dark:text-amber-400" },
    down: { icon: TrendingDown, color: "text-amber-600 dark:text-amber-400" },
    stable: { icon: Minus, color: "text-emerald-600 dark:text-emerald-400" },
  };

  const { icon: TrendIcon, color } = trendConfig[trend ?? "stable"] ?? trendConfig.stable;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-border/60 bg-background p-4 transition-colors hover:border-primary/30 hover:bg-muted/40"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium truncate">{testName}</p>
        {trend && <TrendIcon className={`size-4 ${color} shrink-0 ml-2`} />}
      </div>
      <div className="h-16 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
            <XAxis dataKey="date" hide />
            <YAxis hide domain={["auto", "auto"]} />
            {range && (
              <ReferenceArea y1={range.min} y2={range.max} fill="hsl(var(--primary) / 0.06)" stroke="none" />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{history.length} measurement{history.length !== 1 ? "s" : ""}</span>
        {history.length > 0 && (
          <span>
            {history[history.length - 1]?.value} {unit}
          </span>
        )}
      </div>
    </button>
  );
}

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
      date: new Date(h.uploadedAt).toLocaleDateString(),
      value: isNaN(numValue) ? null : numValue,
      filename: h.filename,
      status: h.status,
    };
  });

  const statusColor = (status: string) => {
    if (status === "critical") return "#ef4444";
    if (status === "high" || status === "low") return "#f59e0b";
    return "#10b981";
  };

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1">
        <ArrowLeft className="size-3.5" />
        Back to all tests
      </Button>

      <Card className="border-border/60 bg-background">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{testName}</CardTitle>
              <CardDescription>
                {history.length} measurement{history.length !== 1 ? "s" : ""} · {unit}
              </CardDescription>
            </div>
            {range && (
              <Badge variant="outline" className="text-muted-foreground">
                Normal: {range.min}–{range.max} {unit}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const point = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                        <p className="font-medium">{point.date}</p>
                        <p className="text-muted-foreground mt-0.5">
                          Value: {point.value} {unit}
                        </p>
                        <p className="text-muted-foreground">Status: {point.status}</p>
                      </div>
                    );
                  }}
                />
                {range && (
                  <ReferenceArea
                    y1={range.min}
                    y2={range.max}
                    fill="hsl(var(--primary) / 0.08)"
                    stroke="none"
                    label={{ value: "Normal range", position: "insideTopRight", fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={({ cx, cy, payload }) => (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={statusColor(payload.status)}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  )}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-sm rounded-md px-3 py-2 hover:bg-muted/50">
                <span className="text-muted-foreground">{new Date(h.uploadedAt).toLocaleDateString()}</span>
                <span className="font-medium">{h.value} {h.unit}</span>
                <Badge
                  variant={
                    h.status === "critical"
                      ? "destructive"
                      : h.status === "high" || h.status === "low"
                        ? "default"
                        : "outline"
                  }
                  className={h.status === "normal" ? "text-emerald-600" : ""}
                >
                  {h.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TrendsPage() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  useEffect(() => {
    api.getTrends()
      .then((res) => setData(res.tests))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const testsWithHistory = data
    ? Object.entries(data).filter(([, history]) => history.length >= 2)
    : [];

  if (loading) {
    return (
      <main className="px-4 py-6 md:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/60">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (testsWithHistory.length === 0) {
    return (
      <main className="px-4 py-6 md:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <FileText className="size-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No trends available yet</h2>
          <p className="text-muted-foreground max-w-md">
            Upload 2 or more reports of the same type (e.g., blood tests) to start seeing trends over time.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-6 md:px-6 lg:px-8 max-w-6xl mx-auto">
      {selectedTest && data?.[selectedTest] ? (
        <DetailedChart
          testName={selectedTest}
          history={data[selectedTest]}
          onBack={() => setSelectedTest(null)}
        />
      ) : (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-display font-medium">Trends</h1>
            <p className="text-muted-foreground mt-1">
              Track your test results across multiple reports
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </main>
  );
}
