"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Files,
  TrendingUp,
  Settings2,
  LogOut,
} from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspaceDrawer } from "@/components/workspace-drawer-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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

const NAV_LINKS = [
  { href: "/app/trends", label: "Trends", icon: TrendingUp },
] as const;

export function NavRail({ userEmail }: NavRailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const drawer = useWorkspaceDrawer();

  const isReportsView = pathname === "/app";

  const handleReports = () => {
    if (pathname === "/app") {
      drawer?.openReports();
    } else {
      router.push("/app?reports=open");
    }
  };

  const handleSignOut = async () => {
    await api.logout();
    router.push("/");
  };

  return (
    <nav className="nav-rail" aria-label="Main navigation">
      <Link
        href="/app"
        className="nav-rail-logo group"
        aria-label="ReportRx home"
      >
            <span className="relative flex size-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 transition-all duration-300 group-hover:bg-[var(--primary)]/15 font-display text-sm font-bold text-[var(--primary)]">
              Rx
        </span>
      </Link>

      <div className="nav-rail-divider" />

      <div className="nav-rail-group">
        <button
          type="button"
          onClick={handleReports}
          className={`nav-rail-item ${isReportsView ? "nav-rail-item--active" : ""}`}
          aria-label="Reports"
          aria-pressed={isReportsView}
        >
          <Files className="size-[18px]" aria-hidden="true" />
          <span className="nav-rail-tooltip">Reports</span>
        </button>

        {NAV_LINKS.map((item) => {
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
              <Icon className="size-[18px]" aria-hidden="true" />
              <span className="nav-rail-tooltip">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="nav-rail-group">
        <Link
          href="/settings"
          className={`nav-rail-item ${pathname === "/settings" ? "nav-rail-item--active" : ""}`}
          aria-label="Settings"
        >
          <Settings2 className="size-[18px]" aria-hidden="true" />
          <span className="nav-rail-tooltip">Settings</span>
        </Link>

        {userEmail && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button type="button" className="nav-rail-item" aria-label="User menu">
                  <Avatar size="sm" className="nav-rail-avatar">
                    <AvatarFallback className="bg-[var(--primary)]/10 text-[11px] font-medium text-[var(--primary)]">
                      {getInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="nav-rail-tooltip">Account</span>
                </button>
              }
            />
            <DropdownMenuContent align="start" side="right" className="ml-3 w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="truncate text-xs text-[var(--muted-foreground)]">
                  {userEmail}
                </DropdownMenuLabel>
                <DropdownMenuItem
                  render={
                    <Link
                      href="/settings"
                      className="flex w-full cursor-pointer items-center gap-2"
                    />
                  }
                >
                  <Settings2 className="size-3.5" data-icon="inline-start" aria-hidden="true" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="size-3.5" data-icon="inline-start" aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}
