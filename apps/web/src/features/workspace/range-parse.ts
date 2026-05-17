export type VisualRange = {
  min: number;
  max: number;
  /** Shown at the left end of the bar */
  leftLabel: string;
  /** Shown at the right end of the bar */
  rightLabel: string;
  /** Original reference text when bounds are inferred */
  referenceLabel?: string;
};

export type ParsedReference =
  | { kind: "interval"; min: number; max: number }
  | { kind: "max"; max: number }
  | { kind: "min"; min: number };

/** First numeric value in a result string (strips units and symbols). */
export function parseNumericValue(raw: string): number | null {
  if (!raw?.trim()) return null;
  const match = raw.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = parseFloat(match[0]);
  return Number.isFinite(n) ? n : null;
}

export function parseReferenceRange(raw: string): ParsedReference | null {
  const s = raw.trim();
  if (!s) return null;

  const interval = s.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:[-–—]|to)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (interval) {
    const min = parseFloat(interval[1]);
    const max = parseFloat(interval[2]);
    if (Number.isFinite(min) && Number.isFinite(max) && min < max) {
      return { kind: "interval", min, max };
    }
  }

  const lessThan = s.match(/(?:<|≤|<=|up to|below|under)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (lessThan) {
    const max = parseFloat(lessThan[1]);
    if (Number.isFinite(max)) return { kind: "max", max };
  }

  const greaterThan = s.match(/(?:>|≥|>=|above|over|at least)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (greaterThan) {
    const min = parseFloat(greaterThan[1]);
    if (Number.isFinite(min)) return { kind: "min", min };
  }

  return null;
}

function formatBound(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const rounded = parseFloat(n.toFixed(2));
  return String(rounded);
}

/** Map parsed reference + result value to bar scale and end labels. */
export function toVisualRange(
  parsed: ParsedReference,
  value: number,
  referenceRaw: string
): VisualRange {
  switch (parsed.kind) {
    case "interval":
      return {
        min: parsed.min,
        max: parsed.max,
        leftLabel: formatBound(parsed.min),
        rightLabel: formatBound(parsed.max),
      };
    case "max": {
      const min = 0;
      const max = parsed.max;
      return {
        min,
        max,
        leftLabel: formatBound(min),
        rightLabel: formatBound(max),
        referenceLabel: referenceRaw,
      };
    }
    case "min": {
      const min = parsed.min;
      const max = Math.max(min * 2, value * 1.5, min + 10);
      return {
        min,
        max,
        leftLabel: formatBound(min),
        rightLabel: formatBound(max),
        referenceLabel: referenceRaw,
      };
    }
  }
}

/** Fallback scale when reference text cannot be parsed. */
export function fallbackVisualRange(
  value: number,
  status: string,
  referenceRaw: string
): VisualRange {
  const magnitude = Math.max(Math.abs(value), 1);
  const padding = magnitude * 0.5;

  const min = Math.max(0, value - padding * 2);
  const max = value + padding * 2;
  return {
    min,
    max,
    leftLabel: "—",
    rightLabel: "—",
    referenceLabel: referenceRaw,
  };
}
