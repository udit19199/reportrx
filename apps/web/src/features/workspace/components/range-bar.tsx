"use client";

import { getResultColorKey, resultMarkerColor } from "../result-status";
import {
  fallbackVisualRange,
  parseNumericValue,
  parseReferenceRange,
  toVisualRange,
  type VisualRange,
} from "../range-parse";

type RangeBarProps = {
  value: string;
  referenceRange: string;
  status: string;
  unit?: string;
  variant?: "compact" | "inline";
};

function buildVisualRange(
  numValue: number,
  referenceRange: string,
  status: string
): VisualRange {
  const parsed = parseReferenceRange(referenceRange);
  if (parsed) return toVisualRange(parsed, numValue, referenceRange);
  return fallbackVisualRange(numValue, status, referenceRange);
}

function computeMarkerLayout(visual: VisualRange, numValue: number) {
  const padding = (visual.max - visual.min) * 0.15 || 1;
  const spanMin = visual.min - padding;
  const spanMax = visual.max + padding;
  const span = spanMax - spanMin || 1;
  const rawPct = ((numValue - spanMin) / span) * 100;
  const markerPct = Math.max(2, Math.min(98, rawPct));
  const normalStart = ((visual.min - spanMin) / span) * 100;
  const normalWidth = ((visual.max - visual.min) / span) * 100;
  return { markerPct, normalStart, normalWidth, range: visual };
}

type InlineRangeTrackProps = {
  numValue: number;
  visual: VisualRange;
  marker: string;
  resultLabel: string;
  referenceRange: string;
  unit?: string;
};

function InlineRangeTrack({
  numValue,
  visual,
  marker,
  resultLabel,
  referenceRange,
  unit,
}: InlineRangeTrackProps) {
  const { markerPct, normalStart, normalWidth, range } = computeMarkerLayout(
    visual,
    numValue
  );

  return (
    <div className="relative min-w-[140px] flex-1">
      <div
        className="group/track relative h-3 w-full rounded-full border border-[var(--border)] bg-[var(--card)]"
        title={
          range.referenceLabel
            ? `${resultLabel} · Ref: ${range.referenceLabel}`
            : resultLabel
        }
      >
        <div
          className="absolute inset-y-0 rounded-full"
          style={{
            left: `${normalStart}%`,
            width: `${normalWidth}%`,
            backgroundColor:
              "color-mix(in srgb, var(--primary) 50%, transparent)",
          }}
        />
        <div
          className="group/marker absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${markerPct}%` }}
        >
          <div
            className="size-4 cursor-default rounded-full border-2 border-[var(--card)] shadow-sm transition-transform duration-200 group-hover/marker:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
            style={{ backgroundColor: marker }}
            tabIndex={0}
            role="button"
            aria-label={`Your result: ${resultLabel}`}
          />
          <span
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-xs font-semibold tabular-nums opacity-0 shadow-md transition-opacity duration-150 group-hover/marker:opacity-100 group-focus-within/marker:opacity-100"
            style={{ color: marker }}
            role="tooltip"
          >
            {resultLabel}
          </span>
        </div>
      </div>
      {referenceRange && (
        <p className="mt-1 truncate text-center text-[11px] text-[var(--muted-foreground)]">
          Ref: {referenceRange}{unit ? ` ${unit}` : ""}
        </p>
      )}
    </div>
  );
}

export function RangeBar({
  value,
  referenceRange,
  status,
  unit,
  variant = "compact",
}: RangeBarProps) {
  const numValue = parseNumericValue(value);
  const marker = resultMarkerColor(status);
  const resultLabel = unit ? `${value} ${unit}`.trim() : value;

  if (numValue === null) {
    return (
      <p className="text-base font-medium text-[var(--foreground)]" title={resultLabel}>
        {value}
        {referenceRange ? (
          <span className="mt-0.5 block text-sm font-normal text-[var(--muted-foreground)]">
            Ref: {referenceRange}{unit ? ` ${unit}` : ""}
          </span>
        ) : null}
      </p>
    );
  }

  const visual = buildVisualRange(numValue, referenceRange, status);

  if (variant === "inline") {
    return (
      <div
        className={`flex w-full min-w-0 gap-2.5 ${referenceRange ? "items-start" : "items-center"}`}
        role="img"
        aria-label={`Your result ${resultLabel}, normal range ${visual.leftLabel} to ${visual.rightLabel}`}
      >
        <span className="w-11 shrink-0 pt-0.5 text-right text-xs font-medium tabular-nums text-[var(--muted-foreground)]">
          {visual.leftLabel}
        </span>

        <InlineRangeTrack
          numValue={numValue}
          visual={visual}
          marker={marker}
          resultLabel={resultLabel}
          referenceRange={referenceRange}
          unit={unit}
        />

        <span className="w-11 shrink-0 pt-0.5 text-left text-xs font-medium tabular-nums text-[var(--muted-foreground)]">
          {visual.rightLabel}
        </span>
      </div>
    );
  }

  const { markerPct } = computeMarkerLayout(visual, numValue);
  const colorKey = getResultColorKey(status);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="relative h-2 w-24 rounded-full bg-[var(--muted)]">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(4, Math.min(100, markerPct))}%`,
              backgroundColor: `var(--result-${colorKey})`,
            }}
          />
        </div>
        <span className="text-sm font-medium text-[var(--foreground)]">{value}</span>
      </div>
      {referenceRange && (
        <p className="text-[11px] text-[var(--muted-foreground)]">
          Ref: {referenceRange}{unit ? ` ${unit}` : ""}
        </p>
      )}
    </div>
  );
}
