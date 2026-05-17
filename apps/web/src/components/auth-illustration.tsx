"use client";

import { CategoryScale, Chart, Filler, LinearScale, LineElement, PointElement } from "chart.js";
import { Line } from "react-chartjs-2";

Chart.register(CategoryScale, LinearScale, LineElement, PointElement, Filler);

const LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const DATA = [14, 18, 12, 22, 16, 26];

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

        <div className="flex flex-col items-center gap-3">
          <div className="w-80">
            <Line
              data={{
                labels: LABELS,
                datasets: [
                  {
                    data: DATA,
                    borderColor: "oklch(0.33 0.055 155)",
                    backgroundColor: "oklch(0.33 0.055 155 / 0.08)",
                    fill: true,
                    pointBackgroundColor: "oklch(0.33 0.055 155)",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.2,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: "oklch(0.56 0 0 / 0.5)", font: { size: 11 } },
                  },
                  y: { display: false, beginAtZero: true },
                },
              }}
            />
          </div>

          <div className="flex items-center gap-6 text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              Normal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              Flagged
            </span>
          </div>
        </div>

        <div className="flex gap-12 text-center text-xs text-[var(--muted-foreground)]">
          <div>
            <p className="font-display text-lg font-medium text-[var(--foreground)]">3</p>
            <p>Reports uploaded</p>
          </div>
          <div className="w-px bg-[var(--border)]/40" />
          <div>
            <p className="font-display text-lg font-medium text-[var(--foreground)]">28</p>
            <p>Tests tracked</p>
          </div>
        </div>
      </div>
    </div>
  );
}
