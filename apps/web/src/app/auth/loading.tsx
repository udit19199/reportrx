import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--background)]">
      <Loader2 className="size-6 animate-spin text-[var(--primary)]" />
    </div>
  );
}
