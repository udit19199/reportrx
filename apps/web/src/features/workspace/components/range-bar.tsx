"use client";

import { useMemo } from "react";

type RangeBarProps = {
  value: string | null;
  referenceRange: string | null;
  status: string;
  unit?: string | null;
};

function parseRange(range: string | null): { min: number; max: number } | null {
  if (!range) return null;
  const match = range.match(/([0-9.]+)\s*[-–—to]+\s*([0-9.]+)/i);
  if (!match) return null;
  return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
}

export function RangeBar({ value, referenceRange, status, unit }: RangeBarProps) {
  const parsed = useMemo(() => {
    const range = parseRange(referenceRange);
    const numValue = value ? parseFloat(value.replace(/[^0-9.-]/g, "")) : null;
    if (!range || numValue === null || isNaN(numValue)) return null;

    const padding = (range.max - range.min) * 0.3;
    const min = range.min - padding;
    const max = range.max + padding;

    const rangeStartPct = ((range.min - min) / (max - min)) * 100;
    const rangeEndPct = ((range.max - min) / (max - min)) * 100;
    const valuePct = Math.max(0, Math.min(100, ((numValue - min) / (max - min)) * 100));

    return { rangeStartPct, rangeEndPct, valuePct, numValue, range, unit };
  }, [value, referenceRange, unit]);

  if (!parsed) {
    return (
      <span className="text-sm text-muted-foreground">
        {value} {unit}
      </span>
    );
  }

  const dotColor =
    status === "critical"
      ? "bg-red-500"
      : status === "high" || status === "low"
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-3 w-28 rounded-full bg-muted/50">
        <div
          className="absolute top-0 h-3 rounded-full bg-emerald-200/60 dark:bg-emerald-800/40"
          style={{
            left: `${parsed.rangeStartPct}%`,
            width: `${parsed.rangeEndPct - parsed.rangeStartPct}%`,
          }}
        />
        <div
          className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-sm ${dotColor}`}
          style={{ left: `${parsed.valuePct}%` }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums w-16">
        {parsed.numValue} {parsed.unit}
      </span>
    </div>
  );
}
