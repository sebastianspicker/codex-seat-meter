const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

/**
 * Format an ISO date string or Date as short date + time (e.g. "Feb 16, 02:46 PM").
 */
export function formatDateTime(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return date.toLocaleString([], DATE_TIME_OPTIONS);
}

/**
 * Format a Date as time only (e.g. "02:46 PM").
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
