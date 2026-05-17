import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full opacity-[0.06]"
        style={{
          background:
            "radial-gradient(circle, oklch(0.33 0.055 155), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <span className="font-display text-[8rem] font-light italic leading-none text-[var(--secondary-foreground)]/20">
        404
      </span>
      <h1 className="-mt-6 text-2xl font-display font-medium text-[var(--foreground)]">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-10 items-center rounded-full bg-[var(--primary)] px-6 text-sm font-medium text-[var(--primary-foreground)] transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5"
      >
        Go home
      </Link>
    </main>
  );
}
