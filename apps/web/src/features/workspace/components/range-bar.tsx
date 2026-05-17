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
    const isHigh = numValue > range.max;
    const isLow = numValue < range.min;
    const colorKey = getResultColorKey(status);

    /* ── Build bar segments ── */
    /* We draw from left → right. Two possible fills:
       1. Normal range zone (always shown)
       2. Excess zone — from the nearest range boundary to the marker, only when out-of-range
    */
    const excessLeft = isHigh
      ? normalStart + normalWidth
      : isLow
        ? normalStart
        : null;
    const excessWidth =
      excessLeft !== null ? Math.abs(markerPct - excessLeft) : 0;

    return (
      <div className="flex min-w-0 items-center gap-2">
        {/* Value */}
        <span
          className="shrink-0 text-base font-semibold tabular-nums"
          style={{ color: marker }}
        >
          {value}
        </span>
        {unit ? (
          <span className="mr-1 shrink-0 text-xs text-[var(--muted-foreground)]">
            {unit}
          </span>
        ) : null}

        {/* Range bar */}
        <div className="relative h-2 min-w-[88px] flex-1 rounded-full bg-[var(--muted)]">
          {/* Normal range zone */}
          <div
            className="absolute inset-y-0 rounded-full"
            style={{
              left: `${normalStart}%`,
              width: `${normalWidth}%`,
              backgroundColor:
                "color-mix(in srgb, var(--result-normal) 30%, transparent)",
            }}
          />
          {/* Out-of-range excess fill */}
          {excessLeft !== null && excessWidth > 1 && (
            <div
              className="absolute inset-y-0 rounded-full"
              style={{
                left: `${excessLeft}%`,
                width: `${excessWidth}%`,
                backgroundColor:
                  "color-mix(in srgb, " + marker + " 50%, transparent)",
              }}
            />
          )}
          {/* Marker dot */}
          <div
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--card)] transition-all duration-300"
            style={{ left: `${markerPct}%`, backgroundColor: marker }}
          />
        </div>

        {/* Reference range — subtly shown on wider screens */}
        <span className="hidden shrink-0 text-[11px] tabular-nums text-[var(--muted-foreground)] sm:inline">
          {range.min} – {range.max}
        </span>
      </div>
    );
  }

  /* ── Compact variant ── */
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
