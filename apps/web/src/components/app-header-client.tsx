"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings2, LogOut } from "lucide-react";

import { api } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AppHeaderClientProps = {
  userEmail: string;
};

function getInitials(email: string): string {
  return email.charAt(0).toUpperCase();
}

export function AppHeaderClient({ userEmail }: AppHeaderClientProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await api.logout();
    router.push("/");
  };

  return (
    <header className="app-top-bar z-50">
      <div className="app-top-bar-inner mx-auto max-w-[1600px]">
        {/* Left: brand + nav */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 font-display text-lg font-medium text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
          >
            ReportRx
            <span className="text-[var(--primary)] opacity-40">✦</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/app"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Workspace
            </Link>
            <Link
              href="/app/trends"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Trends
            </Link>
          </div>
        </div>

        {/* Right: user menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 transition-colors hover:border-[var(--border)] hover:bg-[var(--card)]">
                <Avatar size="sm">
                  <AvatarFallback className="bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium">
                    {getInitials(userEmail)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm text-[var(--foreground)] sm:inline">
                  {userEmail.split("@")[0]}
                </span>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="truncate text-xs text-[var(--muted-foreground)]">
              {userEmail}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={
                <Link
                  href="/settings"
                  className="flex w-full cursor-pointer items-center gap-2"
                />
              }
            >
              <Settings2 className="size-3.5" data-icon="inline-start" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="size-3.5" data-icon="inline-start" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
