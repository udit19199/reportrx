/** Maps API status to one of three result colors (critical → high). */
export type ResultColorKey = "normal" | "high" | "low";

export function getResultColorKey(status: string): ResultColorKey {
  if (status === "low") return "low";
  if (status === "normal") return "normal";
  return "high";
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  moderate: 2,
  low: 3,
  normal: 4,
};

export function compareResultSeverity(a: string, b: string) {
  return (SEVERITY_RANK[a] ?? 2) - (SEVERITY_RANK[b] ?? 2);
}

export function sortByResultSeverity<T extends { status: string }>(items: T[]) {
  return [...items].sort((a, b) => compareResultSeverity(a.status, b.status));
}

export function resultDotStyle(status: string): { backgroundColor: string } {
  const key = getResultColorKey(status);
  return { backgroundColor: `var(--result-${key})` };
}

export function resultMarkerColor(status: string) {
  const key = getResultColorKey(status);
  return `var(--result-${key})`;
}

/* ── Clinical impact text helpers ───────────────── */

type HasTestValue = {
  value: string;
  reference_range: string;
  status: string;
};

function impactFallback(test: HasTestValue) {
  if (test.status === "high" || test.status === "critical") {
    return "Above the expected range.";
  }
  if (test.status === "low") return "Below the expected range.";
  return "Outside the expected range.";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Keep only the clinical impact — strip value/range restatements from AI text.
 */
export function getImpactText(
  explanation: string | undefined,
  test: { value: string; reference_range: string; status: string }
) {
  if (!explanation?.trim()) return impactFallback(test);

  const whichMatch = explanation.match(/,?\s*which\s+(.+)$/i);
  if (whichMatch) {
    const clause = whichMatch[1].trim().replace(/\.$/, "");
    if (clause.length > 12) {
      return clause.charAt(0).toUpperCase() + clause.slice(1) + ".";
    }
  }

  let text = explanation.trim();
  const valuePattern = escapeRegExp(test.value);
  const rangePattern = escapeRegExp(test.reference_range);

  text = text
    .replace(new RegExp(`\\(?\\s*normal range:?\\s*${rangePattern}\\s*\\)?`, "gi"), "")
    .replace(new RegExp(`\\b${valuePattern}\\b`, "g"), "")
    .replace(
      /\b(is|was)\s+(elevated|high|low|decreased|increased)\s+(at|to)?\s*/gi,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .replace(/^[,.\s]+|[,.\s]+$/g, "")
    .trim();

  if (text.length < 20) return impactFallback(test);
  return text.endsWith(".") ? text : `${text}.`;
}
