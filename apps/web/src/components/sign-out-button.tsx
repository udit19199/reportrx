"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await api.logout();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="lux-button rounded-full bg-primary px-6 py-2.5 text-sm font-medium tracking-wide text-primary-foreground"
    >
      Sign Out
    </button>
  );
}
