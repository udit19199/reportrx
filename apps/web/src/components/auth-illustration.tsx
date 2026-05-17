export function AuthIllustration() {
  return (
    <div className="relative hidden items-center justify-center bg-[var(--muted)] lg:flex">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--primary)]/5" />

      <div className="relative flex flex-col items-center gap-8 text-center">
        <div>
          <h2 className="font-display text-2xl font-medium text-[var(--foreground)]">
            Manage your health
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Track lab results, spot trends, and stay informed.
          </p>
        </div>

        <svg viewBox="0 0 320 120" className="w-72">
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.33 0.055 155)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="oklch(0.33 0.055 155)" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[20, 50, 80].map((y, i) => (
            <line
              key={i}
              x1="0" y1={y} x2="320" y2={y}
              stroke="currentColor"
              className="text-[var(--muted-foreground)]/10"
              strokeWidth="0.5"
            />
          ))}

          {/* Bars */}
          {[
            { x: 20, h: 55 },
            { x: 65, h: 75 },
            { x: 110, h: 45 },
            { x: 155, h: 85 },
            { x: 200, h: 60 },
            { x: 245, h: 95 },
          ].map((bar, i) => (
            <rect
              key={i}
              x={bar.x}
              y={100 - bar.h}
              width="30"
              height={bar.h}
              rx="4"
              fill="url(#barGrad)"
            />
          ))}

          {/* Trend line */}
          <path
            d="M35,45 L80,25 L125,55 L170,15 L215,40 L260,5"
            fill="none"
            stroke="oklch(0.33 0.055 155)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[
            [35, 45], [80, 25], [125, 55], [170, 15], [215, 40], [260, 5],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3" fill="oklch(0.33 0.055 155)" />
          ))}
        </svg>
      </div>
    </div>
  );
}
