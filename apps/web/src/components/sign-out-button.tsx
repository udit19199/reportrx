"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { api } from "@/lib/api";

export function SignOutButton({ minimal }: { minimal?: boolean }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await api.logout();
    router.push("/");
    router.refresh();
  };

  if (minimal) {
    return (
      <button
        onClick={handleSignOut}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <LogOut className="size-3.5" />
        Sign Out
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      className="inline-flex h-9 items-center rounded-full bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5"
    >
      Sign Out
    </button>
  );
}
