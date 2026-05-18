"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendDataPoint } from "@/lib/api";
import { parseDate } from "@/lib/utils";
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

type TrendModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testName: string;
  history: TrendDataPoint[];
  currentReport?: {
    filename: string;
    uploadedAt: string;
    value: string | null;
    unit: string | null;
    referenceRange: string | null;
    status: string;
  };
};

function formatTrendDate(value: string | null | undefined): string {
  const d = parseDate(value);
  if (isNaN(d.getTime())) return value ?? "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function parseRange(range: string | null): { min: number; max: number } | null {
  if (!range) return null;
  const match = range.match(/([0-9.]+)\s*[-–—to]+\s*([0-9.]+)/i);
  if (!match) return null;
  return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
}

export function TrendModal({
  open,
  onOpenChange,
  testName,
  history,
  currentReport,
}: TrendModalProps) {
  const range = history.length > 0 ? parseRange(history[0].referenceRange) : null;

  const chartData = history.map((h) => {
    const numValue = parseFloat(h.value?.replace(/[^0-9.-]/g, "") ?? "");
    return {
      date: formatTrendDate(h.reportDate ?? h.uploadedAt),
      value: isNaN(numValue) ? null : numValue,
      reportId: h.reportId,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {testName} — Trend
          </DialogTitle>
          <DialogDescription>
            {history.length} measurement{history.length !== 1 ? "s" : ""} across {history.length} report{history.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Current report context */}
        {currentReport && (
          <div className="flex flex-wrap gap-3 rounded-xl border border-[var(--border)]/60 bg-[var(--muted)]/30 p-3">
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                Current value
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">
                {currentReport.value} {currentReport.unit}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                Reference range
              </p>
              <p className="mt-0.5 text-sm font-medium text-[var(--foreground)]">
                {currentReport.referenceRange ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                Status
              </p>
              <div className="mt-1">
                <Badge
                  variant={
                    currentReport.status === "critical"
                      ? "destructive"
                      : currentReport.status === "high" ||
                          currentReport.status === "low"
                        ? "default"
                        : "outline"
                  }
                  className={
                    currentReport.status === "normal"
                      ? "text-emerald-600"
                      : ""
                  }
                >
                  {currentReport.status}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                From report
              </p>
              <p className="mt-0.5 max-w-[200px] truncate text-sm font-medium text-[var(--foreground)]">
                {currentReport.filename}
              </p>
            </div>
          </div>
        )}

        <Separator className="bg-[var(--border)]/40" />

        {/* Chart — only render when open so dimensions are settled */}
        {open && (
          <div className="h-64">
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
                        Value: {point.value} {history[0]?.unit}
                      </p>
                      <p className="text-[var(--muted-foreground)]">
                        Status: {point.status}
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
        )}

        {/* History list */}
        <div className="space-y-1">
          {history.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-[var(--muted)]/50"
            >
              <span className="text-[var(--muted-foreground)]">
                {formatTrendDate(h.reportDate ?? h.uploadedAt)}
              </span>
              <span className="font-medium text-[var(--foreground)]">
                {h.value} {h.unit}
              </span>
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
      </DialogContent>
    </Dialog>
  );
}
