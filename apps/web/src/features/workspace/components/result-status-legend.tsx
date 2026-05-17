import { cn } from "@/lib/utils";

const LEGEND_ITEMS = [
  { key: "normal" as const, label: "In range" },
  { key: "high" as const, label: "Above range" },
  { key: "low" as const, label: "Below range" },
];

type ResultStatusLegendProps = {
  className?: string;
};

export function ResultStatusLegend({ className }: ResultStatusLegendProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--muted-foreground)]",
        className
      )}
      role="list"
      aria-label="Result color key"
    >
      {LEGEND_ITEMS.map((item) => (
        <span key={item.key} className="flex items-center gap-1.5" role="listitem">
          <span
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: `var(--result-${item.key})` }}
            aria-hidden
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
