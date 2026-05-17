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

export function resultRowAccentClass(status: string) {
  const key = getResultColorKey(status);
  return `border-l-2 border-l-[var(--result-${key})] bg-[var(--result-${key}-bg)]`;
}

export function resultMarkerColor(status: string) {
  const key = getResultColorKey(status);
  return `var(--result-${key})`;
}
