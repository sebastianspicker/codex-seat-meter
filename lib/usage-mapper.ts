import type {
  BalanceCard,
  SeatStatusResponse,
  CodexUsageApiResponse,
} from "@/types/seat";

function formatResetAt(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return d.toISOString();
}

function windowToBalanceCard(
  window: { used_percent: number; reset_at: number },
  label: string
): BalanceCard {
  const remainingPercent = Math.max(0, Math.min(100, 100 - window.used_percent));
  return {
    label,
    remainingPercent,
    resetAt: formatResetAt(window.reset_at),
  };
}

export function mapCodexUsageToStatusResponse(
  data: CodexUsageApiResponse
): SeatStatusResponse {
  const primary = data.rate_limit?.primary_window;
  const secondary = data.rate_limit?.secondary_window;

  const fiveHourUsageLimit: BalanceCard = primary
    ? windowToBalanceCard(primary, "5 hour usage limit")
    : {
        label: "5 hour usage limit",
        remainingPercent: 100,
      };

  const weeklyUsageLimit: BalanceCard = secondary
    ? windowToBalanceCard(secondary, "Weekly usage limit")
    : {
        label: "Weekly usage limit",
        remainingPercent: 100,
      };

  const credits = data.credits
    ? {
        hasCredits: data.credits.has_credits,
        unlimited: data.credits.unlimited,
        balance: data.credits.balance,
      }
    : undefined;

  return {
    ok: true,
    balance: {
      fiveHourUsageLimit,
      weeklyUsageLimit,
      codeReview: null,
    },
    planType: data.plan_type,
    credits,
  };
}
