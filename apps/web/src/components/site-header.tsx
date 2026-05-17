import { getSession } from "@/lib/session";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="fixed top-0 z-50 w-full transition-all duration-500 bg-transparent">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-xl border-b border-white/20"></div>
      <div className="container relative mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-12">
        <div className="flex items-center">
          <Link href="/" className="group flex items-center space-x-2">
            <span className="font-display text-2xl font-medium tracking-tight text-foreground transition-opacity group-hover:opacity-70">
              ReportRx.
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-3 sm:gap-6">
          {session ? (
            <>
              <span className="hidden text-sm text-foreground/70 sm:inline">
                Welcome, {session.user.email.split("@")[0]}.
              </span>
              <Link
                href="/app"
                className="text-sm font-medium tracking-wide text-foreground/80 hover:text-foreground transition-colors"
              >
                Workspace
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium tracking-wide text-foreground/80 hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="lux-button rounded-full bg-primary px-6 py-2.5 text-sm font-medium tracking-wide text-primary-foreground"
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
