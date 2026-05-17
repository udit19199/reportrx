/**
 * InteractiveRow — a clickable row surface that avoids nested-button pitfalls.
 *
 * ═══════════════════════════════════════════════════════════
 * WHY THIS EXISTS
 * ═══════════════════════════════════════════════════════════
 *
 * A common pattern in list UIs is a clickable row WITH action controls
 * inside it (e.g. a dropdown-menu trigger). This is INVALID HTML if you
 * use <button> for the row — you cannot nest <button> inside <button>.
 *
 * InteractiveRow uses <div role="button"> with proper keyboard handling,
 * so inner <button> elements (DropdownMenuTrigger, etc.) are valid.
 *
 * ═══════════════════════════════════════════════════════════
 * WHEN TO USE
 * ═══════════════════════════════════════════════════════════
 *
 *   - A list item that is itself clickable/selectable
 *   - AND also contains interactive controls (menus, buttons, toggles)
 *   - OR you want to avoid the nested-button pitfall
 *
 * ═══════════════════════════════════════════════════════════
 * WHEN NOT TO USE
 * ═══════════════════════════════════════════════════════════
 *
 *   - Simple standalone buttons → use <button> or shadcn Button
 *   - Links → use <a> or Next.js Link
 *   - Plain containers with no interaction → use <div>
 */

import { type ReactNode, useCallback } from "react";
import { cn } from "@/lib/utils";

type InteractiveRowProps = {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  active?: boolean;
  disabled?: boolean;
};

export function InteractiveRow({
  onClick,
  children,
  className,
  active = false,
  disabled = false,
}: InteractiveRowProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick, disabled]
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={disabled ? undefined : handleKeyDown}
      className={cn(
        "group relative cursor-pointer select-none",
        "transition-[background-color,ring,opacity] duration-200",
        disabled && "cursor-default opacity-50 pointer-events-none",
        active && "bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]/20",
        !active && !disabled && "hover:bg-[var(--muted)]/40 focus-visible:ring-1 focus-visible:ring-[var(--primary)]/30",
        className
      )}
    >
      {children}
    </div>
  );
}
