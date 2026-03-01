/**
 * Client-side helpers to build API URLs with optional dashboard secret.
 * Use in browser only (relies on window.location.origin). Throws if called during SSR.
 */

function getBaseUrl(): string {
  if (typeof window === "undefined") {
    throw new Error("api-urls helpers must be used in the browser (window is undefined)");
  }
  return window.location.origin;
}

export function getSeatsUrl(): string {
  const url = new URL("/api/seats", getBaseUrl());
  return url.toString();
}

export function getSeatStatusUrl(seatId: string): string {
  const url = new URL(`/api/seats/${encodeURIComponent(seatId)}/status`, getBaseUrl());
  return url.toString();
}

export function getSeatStatusesUrl(seatIds: string[]): string {
  const url = new URL("/api/seats/statuses", getBaseUrl());
  seatIds.forEach((id) => url.searchParams.append("id", id));
  return url.toString();
}
