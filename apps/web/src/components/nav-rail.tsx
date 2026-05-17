"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Settings2,
  LogOut,
  Sparkles,
} from "lucide-react";
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

type NavRailProps = {
  userEmail?: string;
};

function getInitials(email: string): string {
  return email.charAt(0).toUpperCase();
}

const PRIMARY_NAV = [
  { href: "/app", label: "Reports", icon: LayoutDashboard },
  { href: "/app/trends", label: "Trends", icon: TrendingUp },
] as const;

export function NavRail({ userEmail }: NavRailProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await api.logout();
    router.push("/");
  };

  return (
    <nav className="nav-rail" aria-label="Main navigation">
      {/* ── Logo mark ─────────────────────────── */}
      <Link
        href="/app"
        className="nav-rail-logo group"
        aria-label="ReportRx home"
      >
        <span className="relative flex size-10 items-center justify-center rounded-xl bg-[var(--rail-active)]/10 transition-all duration-300 group-hover:bg-[var(--rail-active)]/20">
          <Sparkles className="size-5 text-[var(--rail-active)]" />
        </span>
      </Link>

      {/* ── Divider ───────────────────────────── */}
      <div className="nav-rail-divider" />

      {/* ── Primary navigation ────────────────── */}
      <div className="nav-rail-group">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-rail-item ${isActive ? "nav-rail-item--active" : ""}`}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-[18px]" />
              <span className="nav-rail-tooltip">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* ── Spacer ────────────────────────────── */}
      <div className="flex-1" />

      {/* ── User section ──────────────────────── */}
      <div className="nav-rail-group">
        <Link
          href="/settings"
          className={`nav-rail-item ${pathname === "/settings" ? "nav-rail-item--active" : ""}`}
          aria-label="Settings"
        >
          <Settings2 className="size-[18px]" />
          <span className="nav-rail-tooltip">Settings</span>
        </Link>

        {userEmail && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="nav-rail-item" aria-label="User menu">
                  <Avatar size="sm" className="nav-rail-avatar">
                    <AvatarFallback className="bg-[var(--rail-active)]/15 text-[11px] font-medium text-[var(--rail-active)]">
                      {getInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="nav-rail-tooltip">Account</span>
                </button>
              }
            />
            <DropdownMenuContent align="start" side="right" className="ml-3 w-52">
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
        )}
      </div>
    </nav>
  );
}
