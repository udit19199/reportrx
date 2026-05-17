"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendDataPoint } from "@/lib/api";
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

function parseRange(range: string | null): { min: number; max: number } | null {
  if (!range) return null;
  const match = range.match(/([0-9.]+)\s*[-–—to]+\s*([0-9.]+)/i);
  if (!match) return null;
  return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
}

export function TrendModal({ open, onOpenChange, testName, history, currentReport }: TrendModalProps) {
  const range = history.length > 0 ? parseRange(history[0].referenceRange) : null;

  const chartData = history.map((h) => {
    const numValue = parseFloat(h.value?.replace(/[^0-9.-]/g, "") ?? "");
    return {
      date: new Date(h.uploadedAt).toLocaleDateString(),
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
          <DialogTitle>{testName} — Trend</DialogTitle>
          <DialogDescription>
            {history.length} measurement{history.length !== 1 ? "s" : ""} across {history.length} report{history.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        {currentReport && (
          <div className="flex flex-wrap gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Current value</p>
              <p className="text-sm font-semibold mt-0.5">
                {currentReport.value} {currentReport.unit}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Reference range</p>
              <p className="text-sm font-medium mt-0.5">{currentReport.referenceRange ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <div className="mt-1">
                <Badge
                  variant={
                    currentReport.status === "critical"
                      ? "destructive"
                      : currentReport.status === "high" || currentReport.status === "low"
                        ? "default"
                        : "outline"
                  }
                  className={currentReport.status === "normal" ? "text-emerald-600" : ""}
                >
                  {currentReport.status}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">From report</p>
              <p className="text-sm font-medium mt-0.5 truncate max-w-[200px]">{currentReport.filename}</p>
            </div>
          </div>
        )}

        <Separator />

        <div className="h-64">
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
                        Value: {point.value} {history[0]?.unit}
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
            <div key={i} className="flex items-center justify-between text-sm rounded-md px-2 py-1.5 hover:bg-muted/50">
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
      </DialogContent>
    </Dialog>
  );
}
