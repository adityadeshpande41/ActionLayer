/**
 * Centralized date utilities - handles null, epoch, invalid dates from Postgres/SQLite
 */

/** Returns a valid Date or null. Rejects nulls, epoch (pre-2020), and Invalid Date */
export function parseDate(val: any): Date | null {
  if (val === null || val === undefined || val === "" || val === 0) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  if (d.getFullYear() < 2020) return null;
  return d;
}

/** Format a date for display. Returns fallback string if date is invalid/missing */
export function formatDate(val: any, fallback = "Unknown date"): string {
  const d = parseDate(val);
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : fallback;
}

/** Format a date+time for display */
export function formatDateTime(val: any, fallback = "Unknown"): string {
  const d = parseDate(val);
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : fallback;
}

/** Format just the date portion (YYYY-MM-DD) */
export function formatDateShort(val: any, fallback = "Unknown"): string {
  const d = parseDate(val);
  return d ? d.toISOString().split("T")[0] : fallback;
}
