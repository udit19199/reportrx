import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const THEME_COLOR = "#f7f3ed";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  display: "swap",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ReportRx",
    template: "%s | ReportRx",
  },
  description:
    "Turn dense medical documents into plain language summaries without the anxiety.",
  metadataBase: new URL(
    process.env.APP_BASE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    siteName: "ReportRx",
    title: "ReportRx | Understand Your Medical Reports",
    description:
      "Turn dense medical documents into plain language summaries without the anxiety.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReportRx | Understand Your Medical Reports",
    description:
      "Turn dense medical documents into plain language summaries without the anxiety.",
  },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        displayFont.variable,
        bodyFont.variable
      )}
    >

      <body className="relative flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]">
        {/* Paper grain overlay */}
        <div className="paper-grain" aria-hidden="true" />

        {/* Skip to main content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-[60] focus-visible:rounded-xl focus-visible:bg-[var(--card)] focus-visible:px-4 focus-visible:py-2.5 focus-visible:text-sm focus-visible:font-medium focus-visible:text-[var(--foreground)] focus-visible:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
        >
          Skip to main content
        </a>

        {children}
        <Toaster richColors closeButton position="bottom-right" />
      </body>
    </html>
  );
}
