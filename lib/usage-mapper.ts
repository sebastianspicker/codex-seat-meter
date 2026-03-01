import type {
  BalanceCard,
  CreditsInfo,
  SeatStatusResponse,
  CodexUsageApiResponse,
  UsageWindow,
} from "@/types/seat";

/** Accept reset_at in seconds or milliseconds (values > 1e12 treated as ms). Returns ISO string or "—" if invalid. */
function formatResetAt(resetAt: number): string {
  if (!Number.isFinite(resetAt)) return "\u2014";
  const ms = resetAt > 1e12 ? resetAt : resetAt * 1000;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? "\u2014" : date.toISOString();
}

function windowToBalanceCard(window: UsageWindow, label: string): BalanceCard {
  const raw = 100 - (Number.isFinite(window.used_percent) ? window.used_percent : 0);
  const remainingPercent = Math.max(0, Math.min(100, raw));
  const resetAt = formatResetAt(window.reset_at);
  return {
    label,
    remainingPercent,
    resetAt: resetAt === "\u2014" ? undefined : resetAt,
  };
}

export function mapCodexUsageToStatusResponse(
  data: CodexUsageApiResponse
): SeatStatusResponse {
  const primary = data.rate_limit?.primary_window;
  const secondary = data.rate_limit?.secondary_window;

  const fiveHourUsageLimit: BalanceCard = primary
    ? windowToBalanceCard(primary, "5 hour usage limit")
    : { label: "5 hour usage limit", remainingPercent: 100 };

  const weeklyUsageLimit: BalanceCard = secondary
    ? windowToBalanceCard(secondary, "Weekly usage limit")
    : { label: "Weekly usage limit", remainingPercent: 100 };

  const credits: CreditsInfo | undefined = data.credits
    ? {
        hasCredits: Boolean(data.credits.has_credits),
        unlimited: Boolean(data.credits.unlimited),
        balance:
          typeof data.credits.balance === "number" && Number.isFinite(data.credits.balance)
            ? data.credits.balance
            : undefined,
      }
    : undefined;

  const planType =
    typeof data.plan_type === "string" && data.plan_type.length > 0 ? data.plan_type : undefined;

  return {
    ok: true,
    balance: {
      fiveHourUsageLimit,
      weeklyUsageLimit,
      codeReview: null,
    },
    planType,
    credits,
  };
}
