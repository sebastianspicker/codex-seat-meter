// ---------------------------------------------------------------------------
// Auth JSON (per-seat file from config directory)
// ---------------------------------------------------------------------------

export interface AuthTokens {
  readonly id_token?: string;
  readonly access_token: string;
  readonly refresh_token?: string;
  readonly account_id?: string;
}

export interface AuthJson {
  readonly auth_mode?: string;
  readonly OPENAI_API_KEY?: string | null;
  readonly tokens?: AuthTokens;
  readonly last_refresh?: string;
}

// ---------------------------------------------------------------------------
// Balance card (UI model)
// ---------------------------------------------------------------------------

export interface BalanceCard {
  readonly label: string;
  readonly remainingPercent: number;
  readonly resetAt?: string;
}

// ---------------------------------------------------------------------------
// Credits snapshot
// ---------------------------------------------------------------------------

export interface CreditsInfo {
  readonly hasCredits: boolean;
  readonly unlimited: boolean;
  readonly balance?: number;
}

// ---------------------------------------------------------------------------
// Status response (discriminated union on `ok`)
// ---------------------------------------------------------------------------

export interface SeatStatusResponse {
  readonly ok: true;
  readonly balance: {
    readonly fiveHourUsageLimit: BalanceCard;
    readonly weeklyUsageLimit: BalanceCard;
    readonly codeReview?: BalanceCard | null;
  };
  readonly planType?: string;
  readonly credits?: CreditsInfo;
}

export interface SeatStatusError {
  readonly ok: false;
  readonly error: string;
}

export type SeatStatusResult = SeatStatusResponse | SeatStatusError;

// ---------------------------------------------------------------------------
// Seat list item (safe fields only, no tokens)
// ---------------------------------------------------------------------------

export interface SeatMeta {
  readonly id: string;
  readonly auth_mode?: string;
  readonly last_refresh?: string;
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// Codex wham/usage API response (external, snake_case)
// ---------------------------------------------------------------------------

export interface UsageWindow {
  readonly used_percent: number;
  readonly reset_at: number;
  readonly limit_window_seconds: number;
}

export interface CodexUsageApiResponse {
  readonly plan_type?: string;
  readonly rate_limit?: {
    readonly primary_window?: UsageWindow;
    readonly secondary_window?: UsageWindow;
  };
  readonly credits?: {
    readonly has_credits: boolean;
    readonly unlimited: boolean;
    readonly balance?: number;
  };
}

// ---------------------------------------------------------------------------
// Runtime type guards
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

/** Validate that a parsed API response looks like a CodexUsageApiResponse. */
export function isCodexUsageApiResponse(
  value: unknown
): value is CodexUsageApiResponse {
  if (!isRecord(value)) return false;
  if ("rate_limit" in value && value.rate_limit != null) {
    if (!isRecord(value.rate_limit)) return false;
  }
  return true;
}

/** Narrow a discriminated union response to success. */
export function isSeatStatusOk(
  value: unknown
): value is SeatStatusResponse {
  return isRecord(value) && value.ok === true && isRecord(value.balance);
}

/** Validate that a value is SeatMeta[]. */
export function isSeatMetaArray(value: unknown): value is SeatMeta[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) => isRecord(item) && typeof item.id === "string"
    )
  );
}
