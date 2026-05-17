import { getSession } from "@/lib/session";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="app-top-bar app-top-bar--fixed z-50">
      <div className="app-top-bar-inner mx-auto max-w-[1400px]">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <span className="font-display text-xl font-medium tracking-tight text-[var(--foreground)] transition-opacity duration-300 group-hover:opacity-70">
            ReportRx
          </span>
          <span className="text-[var(--primary)] opacity-40" aria-hidden="true">✦</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-3 sm:gap-6">
          {session ? (
            <>
              <span className="hidden text-sm text-[var(--muted-foreground)] sm:inline">
                {session.user.email.split("@")[0]}
              </span>
              <Link
                href="/app"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Workspace
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex h-9 items-center rounded-full bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition-[opacity,transform] duration-300 hover:opacity-90 hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
