"use client";

import { BarElement, CategoryScale, Chart, LinearScale, LineElement, PointElement } from "chart.js";
import { Bar } from "react-chartjs-2";

Chart.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement);

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

        <div className="w-72">
          <Bar
            data={{
              labels: ["", "", "", "", "", ""],
              datasets: [
                {
                  data: [12, 18, 10, 22, 14, 26],
                  backgroundColor: "oklch(0.33 0.055 155 / 0.6)",
                  borderRadius: 4,
                  barPercentage: 0.6,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              aspectRatio: 2.6,
              plugins: { legend: { display: false }, tooltip: { enabled: false } },
              scales: {
                x: { display: false },
                y: { display: false, beginAtZero: true },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
