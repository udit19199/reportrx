import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Parse a date string that may be in various formats (common for LLM-extracted dates).
 * Returns a Date object, or the epoch date (1970-01-01) if parsing fails.
 *
 * Handles:
 *   - "25/Mar/2026"     DD/Mon/YYYY
 *   - "March 25, 2026"   Month DD, YYYY
 *   - "2026-03-25"       ISO
 *   - "03/25/2026"       MM/DD/YYYY
 *   - "25-03-2026"       DD-MM-YYYY
 *   - ISO strings passed through Date constructor
 */
export function parseDate(value: string | null | undefined): Date {
  if (!value) return new Date(NaN);

  const s = value.trim();

  // Try ISO / standard first (fast path)
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  // Match "25/Mar/2026" or "25-Mar-2026" or "25 Mar 2026"
  const slashMatch = s.match(
    /^(\d{1,2})\s*[\/\-.]\s*([a-zA-Z]+)\s*[\/\-.]\s*(\d{4})$/
  );
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = MONTH_NAMES[slashMatch[2].toLowerCase()];
    const year = parseInt(slashMatch[3], 10);
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Match "March 25, 2026" or "25 March 2026"
  const wordMatch = s.match(
    /^([a-zA-Z]+)\s+(\d{1,2}),?\s*(\d{4})$/
  );
  if (wordMatch) {
    const month = MONTH_NAMES[wordMatch[1].toLowerCase()];
    const day = parseInt(wordMatch[2], 10);
    const year = parseInt(wordMatch[3], 10);
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Match "25 March 2026" (day before month name)
  const revMatch = s.match(
    /^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/
  );
  if (revMatch) {
    const day = parseInt(revMatch[1], 10);
    const month = MONTH_NAMES[revMatch[2].toLowerCase()];
    const year = parseInt(revMatch[3], 10);
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Last resort: try removing non-numeric separators and parse YYYY-MM-DD / DD-MM-YYYY
  const numMatch = s.match(
    /^(\d{1,4})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{1,4})$/
  );
  if (numMatch) {
    const a = parseInt(numMatch[1], 10);
    const b = parseInt(numMatch[2], 10);
    const c = parseInt(numMatch[3], 10);
    // YYYY-MM-DD
    if (a > 31) return new Date(a, b - 1, c);
    // DD-MM-YYYY
    if (c > 31) return new Date(c, b - 1, a);
    // MM-DD-YYYY (ambiguous, treat as MM/DD/YYYY)
    return new Date(c, a - 1, b);
  }

  return new Date(NaN);
}

/**
 * Format a date string to human-readable form (e.g., "March 25, 2026").
 * Returns the original string if parsing fails.
 */
export function formatReportDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const d = parseDate(dateString);
  if (isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}
