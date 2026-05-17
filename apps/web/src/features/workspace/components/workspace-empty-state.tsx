"use client";

import { FileText, Upload } from "lucide-react";

type WorkspaceEmptyStateProps = {
  title: string;
  description: string;
  onOpenDrawer?: () => void;
};

export function WorkspaceEmptyState({
  title,
  description,
  onOpenDrawer,
}: WorkspaceEmptyStateProps) {
  return (
    <section className="flex min-h-screen items-center justify-center px-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--muted)]">
          <FileText className="size-7 text-[var(--muted-foreground)]/50" />
        </div>
        <h2 className="mt-5 text-lg font-medium text-[var(--foreground)]">
          {title}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
          {description}
        </p>
        {onOpenDrawer && (
          <button
            onClick={onOpenDrawer}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[var(--border)]/50 bg-[var(--card)] px-4 py-2 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <Upload className="size-3.5" />
            Browse reports
          </button>
        )}
      </div>
    </section>
  );
}
