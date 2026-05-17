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
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display text-lg font-medium text-foreground hover:text-primary transition-colors">
            ReportRx.
          </Link>
          <Link href="/app" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Workspace
          </Link>
          <Link href="/app/trends" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Trends
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger nativeButton={false} render={<Avatar className="cursor-pointer" size="sm" />}>
            <AvatarFallback>{getInitials(userEmail)}</AvatarFallback>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="truncate">{userEmail}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings" className="cursor-pointer flex w-full items-center gap-2" />}>
              <Settings2 data-icon="inline-start" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut data-icon="inline-start" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
