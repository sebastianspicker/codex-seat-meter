/**
 * Auth JSON structure (per-seat file from config directory).
 */
export interface AuthTokens {
  id_token?: string;
  access_token: string;
  refresh_token?: string;
  account_id?: string;
}

export interface AuthJson {
  auth_mode?: string;
  OPENAI_API_KEY?: string | null;
  tokens?: AuthTokens;
  last_refresh?: string;
}

/**
 * One balance card (5h limit, weekly limit, or code review).
 */
export interface BalanceCard {
  label: string;
  remainingPercent: number;
  resetAt?: string;
}

/**
 * Success response from GET /api/seats/[id]/status
 */
export interface SeatStatusResponse {
  ok: true;
  balance: {
    fiveHourUsageLimit: BalanceCard;
    weeklyUsageLimit: BalanceCard;
    codeReview?: BalanceCard | null;
  };
  planType?: string;
  credits?: { hasCredits: boolean; unlimited: boolean; balance?: number };
}

/**
 * Error response from GET /api/seats/[id]/status
 */
export interface SeatStatusError {
  ok: false;
  error: string;
}

export type SeatStatusResult = SeatStatusResponse | SeatStatusError;

/**
 * Seat list item (safe fields only, no tokens).
 */
export interface SeatMeta {
  id: string;
  auth_mode?: string;
  last_refresh?: string;
  error?: string;
}

/**
 * Codex wham/usage API response (external).
 */
export interface CodexUsageApiResponse {
  plan_type?: string;
  rate_limit?: {
    primary_window?: {
      used_percent: number;
      reset_at: number;
      limit_window_seconds: number;
    };
    secondary_window?: {
      used_percent: number;
      reset_at: number;
      limit_window_seconds: number;
    };
  };
  credits?: {
    has_credits: boolean;
    unlimited: boolean;
    balance?: number;
  };
}
