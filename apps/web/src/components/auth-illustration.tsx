export function AuthIllustration() {
  return (
    <div className="relative hidden items-center justify-center bg-[var(--muted)] lg:flex">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--primary)]/5" />

      <div className="relative flex flex-col items-center gap-10 text-center">
        <div>
          <h2 className="font-display text-2xl font-medium text-[var(--foreground)]">
            Manage your health
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Track lab results, spot trends, and stay informed.
          </p>
        </div>

        <svg viewBox="0 0 320 120" className="w-80">
          <defs>
            <linearGradient id="authLineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.33 0.055 155)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="oklch(0.33 0.055 155)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,90 Q40,85 80,70 T160,50 T240,30 T320,20"
            fill="none"
            stroke="oklch(0.33 0.055 155)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M0,90 Q40,85 80,70 T160,50 T240,30 T320,20 L320,120 L0,120 Z"
            fill="url(#authLineFill)"
          />
        </svg>

        <div className="flex flex-col gap-2 text-sm text-[var(--muted-foreground)]">
          <p className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[var(--primary)]" />
            Upload your lab reports
          </p>
          <p className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[var(--primary)]" />
            Get a plain-language summary
          </p>
          <p className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[var(--primary)]" />
            Track changes over time
          </p>
        </div>
      </div>
    </div>
  );
}
