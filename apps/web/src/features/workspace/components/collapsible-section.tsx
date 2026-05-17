"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CollapsibleSectionProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
};

export function CollapsibleSection({
  icon: Icon,
  title,
  description,
  defaultExpanded = false,
  children,
  className,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card className={cn("border-border/60 bg-background", className)}>
      <CardHeader className="pb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-2.5 text-left"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10">
            <Icon className="size-4 text-[var(--primary)]" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {expanded ? (
            <ChevronUp className="size-4 shrink-0 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronDown className="size-4 shrink-0 text-[var(--muted-foreground)]" />
          )}
        </button>
      </CardHeader>
      {expanded && <CardContent>{children}</CardContent>}
    </Card>
  );
}
