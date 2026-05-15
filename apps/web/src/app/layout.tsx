import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const THEME_COLOR = "#fcfbf6";

const displayFont = Cormorant_Garamond({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "ReportRx | Understand Your Medical Reports",
  description: "Turn dense medical documents into plain language summaries without the anxiety.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", displayFont.variable, bodyFont.variable)}
    >
      <head>
        <meta name="theme-color" content={THEME_COLOR} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--accent)] selection:text-white relative">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-[60] focus-visible:rounded-md focus-visible:bg-background focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-foreground focus-visible:shadow"
        >
          Skip to main content
        </a>
        <div className="noise-overlay pointer-events-none fixed inset-0 z-50 opacity-[0.03]"></div>
        {children}
      </body>
    </html>
  );
}
