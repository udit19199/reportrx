import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function AuthIllustration() {
  return (
    <div className="relative hidden bg-[var(--muted)] lg:block">
      {/* Warm gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/8 via-[var(--background)]/20 to-[var(--secondary)]/15" />

      {/* Content */}
      <div className="relative flex h-full flex-col items-center justify-center p-12">
        <div className="w-full max-w-md">
          {/* Heritage-style card */}
          <Card className="relative overflow-hidden p-8 shadow-lg">
            {/* Top botanical accent */}
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-[0.06]"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.60 0.07 40), transparent 70%)",
              }}
              aria-hidden="true"
            />

            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]/10">
                <svg
                  className="h-6 w-6 text-[var(--primary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <p className="font-display text-lg font-medium text-[var(--foreground)]">
                Lab Report Analysis
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Processed just now
              </p>
            </div>

            {/* Divider */}
            <Separator className="mb-6" />

            {/* Simulated results */}
            <div className="space-y-3">
              {/* Normal result */}
              <div className="flex items-center justify-between rounded-xl border border-[var(--border)]/50 bg-[var(--card)] p-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Hemoglobin
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">14.2</span>
                  <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                    g/dL
                  </span>
                </div>
              </div>

              {/* High result */}
              <div className="flex items-center justify-between rounded-xl border border-amber-200/60 bg-amber-50/50 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Glucose
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-amber-600">126</span>
                  <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                    mg/dL
                  </span>
                </div>
              </div>

              {/* Normal result */}
              <div className="flex items-center justify-between rounded-xl border border-[var(--border)]/50 bg-[var(--card)] p-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Creatinine
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">0.9</span>
                  <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                    mg/dL
                  </span>
                </div>
              </div>

              {/* Low result */}
              <div className="flex items-center justify-between rounded-xl border border-red-200/60 bg-red-50/50 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Vitamin D
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-red-600">18</span>
                  <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                    ng/mL
                  </span>
                </div>
              </div>
            </div>

            {/* Trend mini-chart */}
            <div className="mt-6 border-t border-[var(--border)]/40 pt-5">
              <p className="mb-3 text-xs font-medium text-[var(--muted-foreground)]">
                3-month trend
              </p>
              <svg viewBox="0 0 280 60" className="h-12 w-full">
                <defs>
                  <linearGradient id="trendFillAuth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.33 0.055 155)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="oklch(0.33 0.055 155)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line
                  x1="0" y1="15" x2="280" y2="15"
                  stroke="currentColor" className="text-[var(--muted-foreground)]/10"
                  strokeWidth="0.5"
                />
                <line
                  x1="0" y1="30" x2="280" y2="30"
                  stroke="currentColor" className="text-[var(--muted-foreground)]/10"
                  strokeWidth="0.5"
                />
                <line
                  x1="0" y1="45" x2="280" y2="45"
                  stroke="currentColor" className="text-[var(--muted-foreground)]/10"
                  strokeWidth="0.5"
                />
                <path
                  d="M0,40 L40,35 L80,38 L120,25 L160,28 L200,20 L240,22 L280,15 L280,60 L0,60 Z"
                  fill="url(#trendFillAuth)"
                />
                <path
                  d="M0,40 L40,35 L80,38 L120,25 L160,28 L200,20 L240,22 L280,15"
                  fill="none"
                  stroke="oklch(0.33 0.055 155)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {[
                  [0, 40], [40, 35], [80, 38], [120, 25],
                  [160, 28], [200, 20], [240, 22], [280, 15],
                ].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="3" fill="oklch(0.33 0.055 155)" />
                ))}
              </svg>
            </div>
          </Card>

          {/* Floating badges */}
          <div className="absolute -top-3 -right-3 rounded-full bg-[var(--primary)] px-3.5 py-1 text-[0.7rem] font-medium uppercase tracking-wider text-[var(--primary-foreground)] shadow-lg">
            AI Powered
          </div>
          <div className="absolute -bottom-3 -left-3 rounded-xl border bg-[var(--card)] px-4 py-2.5 text-xs shadow-md">
            <div className="flex items-center gap-2">
              <svg
                className="h-3.5 w-3.5 text-emerald-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">All reports analyzed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
