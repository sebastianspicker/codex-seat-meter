/**
 * Mock data for demo mode. Used when DEMO_MODE=1 so the dashboard
 * runs without SEATS_DIRECTORY or upstream API calls.
 */

import type { SeatMeta, SeatStatusResponse } from "@/types/seat";

/** Mock seat list for demo mode. */
export const MOCK_SEATS: readonly SeatMeta[] = [
  {
    id: "personal",
    auth_mode: "chatgpt",
    last_refresh: "2026-02-28T10:00:00.000Z",
  },
  {
    id: "team-alpha",
    auth_mode: "chatgpt",
    last_refresh: "2026-02-28T09:45:00.000Z",
  },
  {
    id: "team-beta",
    auth_mode: "chatgpt",
    last_refresh: "2026-02-28T09:30:00.000Z",
  },
] as const;

/** Build a mock status response with varied usage/credits per seat. */
export function getMockSeatStatus(seatId: string): SeatStatusResponse {
  const now = Date.now();
  const in5h = now + 5 * 60 * 60 * 1000;
  const in7d = now + 7 * 24 * 60 * 60 * 1000;
  const toIso = (ms: number) => new Date(ms).toISOString();

  // Vary demo data by seat id for a more realistic demo
  const variants: Record<string, { fiveHour: number; weekly: number; plan: string; credits: number }> = {
    personal: { fiveHour: 72, weekly: 88, plan: "pro", credits: 12.5 },
    "team-alpha": { fiveHour: 45, weekly: 60, plan: "team", credits: 0 },
    "team-beta": { fiveHour: 100, weekly: 100, plan: "pro", credits: 25 },
  };
  const v = variants[seatId] ?? { fiveHour: 80, weekly: 70, plan: "pro", credits: 10 };

  return {
    ok: true,
    balance: {
      fiveHourUsageLimit: {
        label: "5 hour usage limit",
        remainingPercent: v.fiveHour,
        resetAt: toIso(in5h),
      },
      weeklyUsageLimit: {
        label: "Weekly usage limit",
        remainingPercent: v.weekly,
        resetAt: toIso(in7d),
      },
      codeReview: null,
    },
    planType: v.plan,
    credits: {
      hasCredits: v.credits > 0,
      unlimited: false,
      balance: v.credits,
    },
  };
}
