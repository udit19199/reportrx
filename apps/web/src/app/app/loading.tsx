import { Loader2 } from "lucide-react";

export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-6 animate-spin text-[var(--primary)]" />
        <p className="text-sm text-[var(--muted-foreground)]">
          Loading workspace&hellip;
        </p>
      </div>
    </div>
  );
}
