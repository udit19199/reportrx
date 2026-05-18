import { ImageResponse } from "next/og";

export const alt = "ReportRx — Understand Your Medical Reports";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f3ef",
          fontFamily: "serif",
        }}
      >
        {/* Decorative accent */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, oklch(0.90 0.04 145 / 0.3), transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -80,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, oklch(0.92 0.03 60 / 0.2), transparent 70%)",
          }}
        />

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "#2d4a3e",
            }}
          >
            ReportRx
          </span>
          <span style={{ fontSize: 28, color: "#2d4a3e", opacity: 0.5 }}>
            ✦
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 300,
            color: "#78716c",
            letterSpacing: "0.02em",
            marginTop: 8,
          }}
        >
          Understand your medical reports,
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            fontStyle: "italic",
            color: "#44403c",
            marginTop: 4,
          }}
        >
          without the anxiety.
        </div>

        {/* Bottom divider */}
        <div
          style={{
            width: 80,
            height: 1,
            background: "#d6d3cd",
            marginTop: 32,
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
