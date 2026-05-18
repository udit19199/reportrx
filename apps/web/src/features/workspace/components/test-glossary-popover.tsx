"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, BookOpen, X } from "lucide-react";
import { getTestExplanation } from "../medical-glossary";

type TestGlossaryPopoverProps = {
  testName: string;
  /** If true, renders a full cell with description inline instead of a popover trigger. */
  inline?: boolean;
};

/**
 * A trigger that shows a plain-language explanation of a medical test.
 *
 * When `inline` is false (default): renders the test name with a subtle hint icon.
 * Clicking opens a floating card with the explanation.
 *
 * When `inline` is true: renders the description text directly (for table columns).
 */
export function TestGlossaryPopover({
  testName,
  inline = false,
}: TestGlossaryPopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const explanation = getTestExplanation(testName);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  if (inline) {
    // Render as inline description text
    return (
      <span className="text-sm leading-relaxed text-[var(--muted-foreground)]">
        {explanation ?? (
          <span className="italic">
            {testName} — A medical test that helps your doctor assess your health.
            Ask your doctor for a detailed explanation of this specific test.
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`Learn what "${testName}" means`}
        className="group inline-flex items-start gap-1 border-b border-dotted border-[var(--muted-foreground)]/30 font-medium text-[var(--foreground)] transition-colors hover:border-[var(--primary)]/50 hover:text-[var(--primary)] text-left whitespace-normal break-words"
      >
        <span>{testName}</span>
        <HelpCircle className="size-3 shrink-0 text-[var(--muted-foreground)]/40 transition-colors group-hover:text-[var(--primary)]/60" aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="fixed z-50 w-72 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg"
          style={{
            top: triggerRef.current
              ? triggerRef.current.getBoundingClientRect().bottom + 8
              : 0,
            left: triggerRef.current
              ? Math.min(
                  triggerRef.current.getBoundingClientRect().left,
                  window.innerWidth - 300
                )
              : 0,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 shrink-0 text-[var(--primary)]" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--primary)]">
                What is this?
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex size-5 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              aria-label="Close"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">
            {explanation ?? (
              <>
                <span className="font-medium">{testName}</span> — A medical test
                that helps your doctor assess your health. Ask your doctor for a
                detailed explanation of what this specific test looks for.
              </>
            )}
          </p>
        </div>
      )}
    </span>
  );
}
