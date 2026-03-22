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

  it("returns zero counts for an empty seat list", () => {
    const stats = computeDashboardStats([], {});
    expect(stats).toEqual({
      activeSeats: 0,
      totalErrors: 0,
      totalCredits: 0,
      minRateLimit: null,
    });
  });

  it("counts all seats in error state correctly", () => {
    const seats: SeatMeta[] = [
      { id: "seat-1", error: "bad file" },
      { id: "seat-2" },
      { id: "seat-3" },
    ];

    const statuses: Record<string, StatusState> = {
      "seat-1": {
        state: "ok",
        data: {
          ok: true,
          balance: {
            fiveHourUsageLimit: { label: "5h", remainingPercent: 90 },
            weeklyUsageLimit: { label: "week", remainingPercent: 80 },
            codeReview: null,
          },
        },
      },
      "seat-2": { state: "error", data: { ok: false, error: "upstream" } },
      "seat-3": { state: "error", data: { ok: false, error: "timeout" } },
    };

    const stats = computeDashboardStats(seats, statuses);
    // seat-1 has file error so its status is ignored even though state is "ok"
    // seat-2 and seat-3 are API errors (no file error)
    expect(stats.activeSeats).toBe(0);
    expect(stats.totalErrors).toBe(3); // 1 file error + 2 API errors
    expect(stats.minRateLimit).toBeNull();
  });

  it("handles empty statuses object with seats", () => {
    const seats: SeatMeta[] = [{ id: "a" }, { id: "b" }];
    const statuses: Record<string, StatusState> = {};

    const stats = computeDashboardStats(seats, statuses);
    expect(stats.activeSeats).toBe(0);
    expect(stats.totalErrors).toBe(0);
    expect(stats.totalCredits).toBe(0);
    expect(stats.minRateLimit).toBeNull();
  });
});
