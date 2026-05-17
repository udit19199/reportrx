"use client";

import { getResultColorKey, resultMarkerColor } from "../result-status";

type RangeBarProps = {
  value: string;
  referenceRange: string;
  status: string;
  unit: string;
  variant?: "compact" | "inline";
};

function parseRange(range: string): { min: number; max: number } | null {
  const match = range.match(/([0-9.]+)\s*[-–—]+\s*([0-9.]+)/);
  if (!match) return null;
  return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
}

export function RangeBar({
  value,
  referenceRange,
  status,
  unit,
  variant = "compact",
}: RangeBarProps) {
  const numValue = parseFloat(value);
  const range = parseRange(referenceRange);
  const marker = resultMarkerColor(status);

  if (isNaN(numValue) || !range) {
    return (
      <span className="text-sm font-medium text-[var(--foreground)]">
        {value} {unit}
      </span>
    );
  }

  const spanMin = range.min * 0.8;
  const spanMax = range.max * 1.2;
  const span = spanMax - spanMin;
  const markerPct = Math.max(2, Math.min(98, ((numValue - spanMin) / span) * 100));
  const normalStart = ((range.min - spanMin) / span) * 100;
  const normalWidth = ((range.max - range.min) / span) * 100;

  if (variant === "inline") {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className="shrink-0 tabular-nums">
          <span
            className="text-base font-semibold"
            style={{ color: marker }}
          >
            {value}
          </span>
          {unit ? (
            <span className="ml-1 text-xs text-[var(--muted-foreground)]">
              {unit}
            </span>
          ) : null}
        </div>
        <div className="relative h-2 min-w-[88px] flex-1 rounded-full bg-[var(--muted)]">
          <div
            className="absolute inset-y-0 rounded-full"
            style={{
              left: `${normalStart}%`,
              width: `${normalWidth}%`,
              backgroundColor:
                "color-mix(in srgb, var(--result-normal) 35%, transparent)",
            }}
          />
          <div
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--card)]"
            style={{ left: `${markerPct}%`, backgroundColor: marker }}
          />
        </div>
        <span className="shrink-0 text-xs tabular-nums text-[var(--muted-foreground)]">
          {range.min} – {range.max}
        </span>
      </div>
    );
  }

  const pct = Math.min(((numValue - spanMin) / span) * 100, 100);
  const colorKey = getResultColorKey(status);

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-20 rounded-full bg-[var(--muted)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(2, Math.min(100, pct))}%`,
            backgroundColor: `var(--result-${colorKey})`,
          }}
        />
      </div>
      <span className="text-sm font-medium text-[var(--foreground)]">
        {value}
      </span>
      <span className="text-xs text-[var(--muted-foreground)]">{unit}</span>
    </div>
  );
}
