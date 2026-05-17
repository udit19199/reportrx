"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--background)] px-4">
      <Card className="max-w-md border-destructive/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-destructive">Authentication error</CardTitle>
          <CardDescription>Something went wrong while signing in.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg bg-[var(--muted)] p-4 text-sm font-mono text-[var(--muted-foreground)]">
            {error.message ?? "Unknown error"}
          </div>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </main>
  );
}
