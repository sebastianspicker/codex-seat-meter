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

export type StatusState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok"; data: SeatStatusResponse }
  | { state: "error"; data: SeatStatusError };

// ---------------------------------------------------------------------------
// Seat list item (safe fields only, no tokens)
// ---------------------------------------------------------------------------

export interface SeatMeta {
  readonly id: string;
  readonly auth_mode?: string;
  readonly last_refresh?: string;
  readonly error?: string;
}

export interface SeatStatusesResponse {
  readonly ok: true;
  readonly fetchedAt: string;
  readonly statuses: Record<string, SeatStatusResult>;
}

export type DashboardFilter = "all" | "healthy" | "file-error" | "api-error" | "low-limit";
export type DashboardSort = "id" | "lowest-limit" | "highest-credits" | "error-first";

export interface DashboardPreferences {
  readonly autoRefresh: boolean;
  readonly intervalMs: number;
  readonly sort: DashboardSort;
  readonly filter: DashboardFilter;
  readonly query: string;
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
