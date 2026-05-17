import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoginPageInner } from "./login-page-inner";
import { AuthIllustration } from "@/components/auth-illustration";

export const metadata: Metadata = {
  title: "Sign In | ReportRx",
  description: "Sign in to your ReportRx account to access your medical report summaries.",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Form side */}
      <div className="relative flex flex-col p-6 md:p-10">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full opacity-[0.08]"
          style={{
            background:
              "radial-gradient(circle, oklch(0.33 0.055 155), transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-medium"
        >
          <span className="font-display text-lg text-[var(--foreground)]">
            ReportRx
          </span>
          <span className="text-[var(--primary)] opacity-40">✦</span>
        </Link>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Suspense>
              <LoginPageInner />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Illustration side */}
      <AuthIllustration />
    </div>
  );
}
