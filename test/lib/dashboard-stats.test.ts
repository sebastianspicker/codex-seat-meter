// @vitest-environment node

import { describe, expect, it } from "vitest";
import { computeDashboardStats } from "@/lib/dashboard-stats";
import type { SeatMeta, StatusState } from "@/types/seat";

describe("computeDashboardStats", () => {
  it("derives counts and minimum limit from active seat statuses", () => {
    const seats: SeatMeta[] = [
      { id: "ok-seat" },
      { id: "api-error-seat" },
      { id: "file-error-seat", error: "Bad JSON" },
    ];

    const statuses: Record<string, StatusState> = {
      "ok-seat": {
        state: "ok",
        data: {
          ok: true,
          balance: {
            fiveHourUsageLimit: { label: "5h", remainingPercent: 30 },
            weeklyUsageLimit: { label: "week", remainingPercent: 50 },
            codeReview: null,
          },
          credits: { hasCredits: true, unlimited: false, balance: 10 },
          planType: "pro",
        },
      },
      "api-error-seat": {
        state: "error",
        data: { ok: false, error: "Upstream failure" },
      },
      // Should be ignored because this seat currently has a file error.
      "file-error-seat": {
        state: "ok",
        data: {
          ok: true,
          balance: {
            fiveHourUsageLimit: { label: "5h", remainingPercent: 99 },
            weeklyUsageLimit: { label: "week", remainingPercent: 99 },
            codeReview: null,
          },
          credits: { hasCredits: true, unlimited: false, balance: 9999 },
          planType: "pro",
        },
      },
    };

    const stats = computeDashboardStats(seats, statuses);

    expect(stats).toEqual({
      activeSeats: 1,
      totalErrors: 2,
      totalCredits: 10,
      minRateLimit: 30,
    });
  });

  it("returns null minimum when no active seats exist", () => {
    const seats: SeatMeta[] = [{ id: "a" }];
    const statuses: Record<string, StatusState> = {
      a: { state: "error", data: { ok: false, error: "boom" } },
    };

    const stats = computeDashboardStats(seats, statuses);
    expect(stats.minRateLimit).toBeNull();
  });
});
