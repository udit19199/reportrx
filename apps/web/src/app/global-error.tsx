"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 antialiased">
        <div className="mx-auto max-w-md text-center">
          <span className="font-display text-[8rem] font-light italic leading-none text-[var(--secondary-foreground)]/20">
            500
          </span>
          <h1 className="-mt-6 text-2xl font-display font-medium text-[var(--foreground)]">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            An unexpected error occurred. Please try again.
          </p>
          <Button onClick={reset} className="mt-8">
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
