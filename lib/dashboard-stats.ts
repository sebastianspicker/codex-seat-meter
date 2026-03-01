import type { SeatMeta, StatusState } from "@/types/seat";

export interface DashboardStats {
  activeSeats: number;
  totalErrors: number;
  totalCredits: number;
  minRateLimit: number | null;
}

export function computeDashboardStats(
  seats: SeatMeta[],
  statuses: Record<string, StatusState>
): DashboardStats {
  let totalCredits = 0;
  let minRateLimit = 100;
  let okCount = 0;
  let apiErrorCount = 0;

  const fileErrorCount = seats.filter((s) => s.error).length;
  // Ignore statuses for seats that currently have local file parse errors.
  const activeIds = new Set(seats.filter((s) => !s.error).map((s) => s.id));

  Object.entries(statuses).forEach(([id, status]) => {
    if (!activeIds.has(id)) return;

    if (status.state === "ok") {
      okCount++;
      const balance = status.data.credits?.balance;
      if (typeof balance === "number" && Number.isFinite(balance)) {
        totalCredits += balance;
      }

      const fiveHourPercent = status.data.balance.fiveHourUsageLimit.remainingPercent;
      const weeklyPercent = status.data.balance.weeklyUsageLimit.remainingPercent;
      minRateLimit = Math.min(minRateLimit, fiveHourPercent, weeklyPercent);
      return;
    }

    if (status.state === "error") {
      apiErrorCount++;
    }
  });

  return {
    activeSeats: okCount,
    totalErrors: fileErrorCount + apiErrorCount,
    totalCredits,
    minRateLimit: okCount === 0 ? null : minRateLimit,
  };
}
