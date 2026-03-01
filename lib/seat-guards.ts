import type {
  AuthJson,
  BalanceCard,
  CodexUsageApiResponse,
  SeatStatusesResponse,
  SeatStatusResult,
  SeatMeta,
  SeatStatusResponse,
  UsageWindow,
} from "@/types/seat";

/** Type guard: value is a plain object (not null, not array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBalanceCardLike(value: unknown): value is BalanceCard {
  const v = value as Record<string, unknown>;
  if (
    !isRecord(value) ||
    typeof v.label !== "string" ||
    typeof v.remainingPercent !== "number" ||
    !Number.isFinite(v.remainingPercent as number)
  ) {
    return false;
  }
  if (v.resetAt != null && typeof v.resetAt !== "string") return false;
  return true;
}

/** Validate that a parsed JSON value conforms to AuthJson shape. */
export function isAuthJson(value: unknown): value is AuthJson {
  if (!isRecord(value)) return false;
  if ("tokens" in value && value.tokens != null) {
    if (!isRecord(value.tokens)) return false;
    if (typeof value.tokens.access_token !== "string") return false;
  }
  return true;
}

function isUsageWindowLike(value: unknown): value is UsageWindow {
  const v = value as Record<string, unknown>;
  return (
    isRecord(value) &&
    typeof v.used_percent === "number" &&
    Number.isFinite(v.used_percent as number) &&
    typeof v.reset_at === "number" &&
    Number.isFinite(v.reset_at as number)
  );
}

/** Validate that a parsed API response looks like a CodexUsageApiResponse with at least one usage window. */
export function isCodexUsageApiResponse(
  value: unknown
): value is CodexUsageApiResponse {
  if (!isRecord(value)) return false;
  const rl = value.rate_limit;
  if (rl == null || !isRecord(rl)) return false;
  const r = rl as Record<string, unknown>;
  if (r.primary_window != null && !isUsageWindowLike(r.primary_window)) return false;
  if (r.secondary_window != null && !isUsageWindowLike(r.secondary_window)) return false;
  return r.primary_window != null || r.secondary_window != null;
}

/** Narrow a discriminated union response to success. */
export function isSeatStatusOk(
  value: unknown
): value is SeatStatusResponse {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.balance)) return false;
  const b = value.balance as Record<string, unknown>;
  return isBalanceCardLike(b.fiveHourUsageLimit) && isBalanceCardLike(b.weeklyUsageLimit);
}

export function isSeatStatusResult(value: unknown): value is SeatStatusResult {
  if (isSeatStatusOk(value)) return true;
  return isRecord(value) && value.ok === false && typeof value.error === "string";
}

export function isSeatStatusesResponse(value: unknown): value is SeatStatusesResponse {
  if (!isRecord(value) || value.ok !== true) return false;
  if (typeof value.fetchedAt !== "string") return false;
  if (!isRecord(value.statuses)) return false;

  return Object.values(value.statuses).every((v) => isSeatStatusResult(v));
}

/** Validate that a value is SeatMeta[]. */
export function isSeatMetaArray(value: unknown): value is SeatMeta[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    if (!isRecord(item) || typeof item.id !== "string") return false;
    const o = item as Record<string, unknown>;
    if (o.auth_mode != null && typeof o.auth_mode !== "string") return false;
    if (o.last_refresh != null && typeof o.last_refresh !== "string") return false;
    if (o.error != null && typeof o.error !== "string") return false;
    return true;
  });
}
