"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { type TrendDataPoint } from "@/lib/api";

type TrendBadgeProps = {
  history: TrendDataPoint[];
  onClick: () => void;
};

function computeTrend(history: TrendDataPoint[]): "up" | "down" | "stable" | null {
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

export function TrendBadge({ history, onClick }: TrendBadgeProps) {
  const trend = computeTrend(history);
  if (!trend) return null;

  const config = {
    up: { icon: TrendingUp, label: "Trending up", color: "text-amber-600 dark:text-amber-400" },
    down: { icon: TrendingDown, label: "Trending down", color: "text-amber-600 dark:text-amber-400" },
    stable: { icon: Minus, label: "Stable", color: "text-emerald-600 dark:text-emerald-400" },
  };

  const { icon: Icon, label, color } = config[trend];

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-xs font-medium transition-colors hover:bg-muted ${color}`}
      title={`${label} — click to see trend`}
    >
      <Icon className="size-3" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
