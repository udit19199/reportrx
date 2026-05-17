export function AuthIllustration() {
  return (
    <div className="relative hidden bg-muted lg:block">
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12">
        <div className="relative w-full max-w-md">
          {/* Decorative grid background */}
          <div className="absolute inset-0 opacity-[0.03]">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Main illustration card */}
          <div className="relative rounded-2xl border bg-card/80 p-8 shadow-lg backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Lab Report Analysis</p>
                <p className="text-xs text-muted-foreground">Processed 2 minutes ago</p>
              </div>
            </div>

            {/* Simulated results */}
            <div className="space-y-3">
              {/* Normal result */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium">Hemoglobin</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">14.2</span>
                  <span className="text-xs text-muted-foreground ml-1">g/dL</span>
                </div>
              </div>

              {/* High result */}
              <div className="flex items-center justify-between rounded-lg bg-amber-500/10 p-3">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium">Glucose</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">126</span>
                  <span className="text-xs text-muted-foreground ml-1">mg/dL</span>
                </div>
              </div>

              {/* Normal result */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium">Creatinine</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">0.9</span>
                  <span className="text-xs text-muted-foreground ml-1">mg/dL</span>
                </div>
              </div>

              {/* Low result */}
              <div className="flex items-center justify-between rounded-lg bg-red-500/10 p-3">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-red-500" />
                  <span className="text-sm font-medium">Vitamin D</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">18</span>
                  <span className="text-xs text-muted-foreground ml-1">ng/mL</span>
                </div>
              </div>
            </div>

            {/* Trend mini-chart */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-3">3-month trend</p>
              <svg viewBox="0 0 280 60" className="w-full h-12">
                {/* Grid lines */}
                <line x1="0" y1="15" x2="280" y2="15" stroke="currentColor" className="text-muted-foreground/20" strokeWidth="0.5" />
                <line x1="0" y1="30" x2="280" y2="30" stroke="currentColor" className="text-muted-foreground/20" strokeWidth="0.5" />
                <line x1="0" y1="45" x2="280" y2="45" stroke="currentColor" className="text-muted-foreground/20" strokeWidth="0.5" />
                {/* Area fill */}
                <path
                  d="M0,40 L40,35 L80,38 L120,25 L160,28 L200,20 L240,22 L280,15 L280,60 L0,60 Z"
                  className="fill-primary/10"
                />
                {/* Line */}
                <path
                  d="M0,40 L40,35 L80,38 L120,25 L160,28 L200,20 L240,22 L280,15"
                  fill="none"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Dots */}
                <circle cx="0" cy="40" r="3" className="fill-primary" />
                <circle cx="40" cy="35" r="3" className="fill-primary" />
                <circle cx="80" cy="38" r="3" className="fill-primary" />
                <circle cx="120" cy="25" r="3" className="fill-primary" />
                <circle cx="160" cy="28" r="3" className="fill-primary" />
                <circle cx="200" cy="20" r="3" className="fill-primary" />
                <circle cx="240" cy="22" r="3" className="fill-primary" />
                <circle cx="280" cy="15" r="3" className="fill-primary" />
              </svg>
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -top-3 -right-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-md">
            AI Powered
          </div>
          <div className="absolute -bottom-3 -left-3 rounded-lg border bg-card px-3 py-2 text-xs shadow-md flex items-center gap-2">
            <svg className="size-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">All reports analyzed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
