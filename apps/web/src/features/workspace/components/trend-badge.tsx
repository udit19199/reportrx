"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TrendDataPoint } from "@/lib/api";

type TrendBadgeProps = {
  history: TrendDataPoint[];
};

function computeTrend(
  history: TrendDataPoint[]
): "up" | "down" | "stable" | null {
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

export function TrendBadge({ history }: TrendBadgeProps) {
  const trend = computeTrend(history);

  if (!trend) return null;

  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const color =
    trend === "up" || trend === "down"
      ? "text-amber-600 dark:text-amber-400"
      : "text-emerald-600 dark:text-emerald-400";
  const label = trend === "up" ? "Rising" : trend === "down" ? "Falling" : "Stable";

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--muted-foreground)]">
      <Icon className={`size-3 ${color}`} />
      <span>{label}</span>
    </span>
  );
}
