// @vitest-environment node

import { describe, expect, it } from "vitest";
import { mapCodexUsageToStatusResponse } from "@/lib/usage-mapper";

describe("mapCodexUsageToStatusResponse", () => {
  it("maps usage windows into clamped balance percentages and credits", () => {
    const mapped = mapCodexUsageToStatusResponse({
      plan_type: "pro",
      rate_limit: {
        primary_window: {
          used_percent: 120,
          reset_at: 1_900_000_000,
          limit_window_seconds: 18000,
        },
        secondary_window: {
          used_percent: -10,
          reset_at: 1_900_000_000_000,
          limit_window_seconds: 604800,
        },
      },
      credits: {
        has_credits: true,
        unlimited: false,
        balance: 42.25,
      },
    });

    expect(mapped.ok).toBe(true);
    expect(mapped.balance.fiveHourUsageLimit.remainingPercent).toBe(0);
    expect(mapped.balance.weeklyUsageLimit.remainingPercent).toBe(100);
    expect(mapped.planType).toBe("pro");
    expect(mapped.credits?.balance).toBe(42.25);
  });

  it("falls back to full remaining when windows are missing", () => {
    const mapped = mapCodexUsageToStatusResponse({});
    expect(mapped.balance.fiveHourUsageLimit.remainingPercent).toBe(100);
    expect(mapped.balance.weeklyUsageLimit.remainingPercent).toBe(100);
    expect(mapped.credits).toBeUndefined();
  });

  it("returns 0% remaining when usage is at 100% (fully consumed)", () => {
    const mapped = mapCodexUsageToStatusResponse({
      rate_limit: {
        primary_window: {
          used_percent: 100,
          reset_at: 1_900_000_000,
          limit_window_seconds: 18000,
        },
        secondary_window: {
          used_percent: 100,
          reset_at: 1_900_000_000,
          limit_window_seconds: 604800,
        },
      },
    });

    expect(mapped.balance.fiveHourUsageLimit.remainingPercent).toBe(0);
    expect(mapped.balance.weeklyUsageLimit.remainingPercent).toBe(0);
  });

  it("returns 100% remaining when usage is at 0% (unused)", () => {
    const mapped = mapCodexUsageToStatusResponse({
      rate_limit: {
        primary_window: {
          used_percent: 0,
          reset_at: 1_900_000_000,
          limit_window_seconds: 18000,
        },
        secondary_window: {
          used_percent: 0,
          reset_at: 1_900_000_000,
          limit_window_seconds: 604800,
        },
      },
    });

    expect(mapped.balance.fiveHourUsageLimit.remainingPercent).toBe(100);
    expect(mapped.balance.weeklyUsageLimit.remainingPercent).toBe(100);
  });

  it("handles missing/null fields gracefully", () => {
    // rate_limit present but no windows
    const mapped = mapCodexUsageToStatusResponse({
      rate_limit: {},
    });
    expect(mapped.balance.fiveHourUsageLimit.remainingPercent).toBe(100);
    expect(mapped.balance.weeklyUsageLimit.remainingPercent).toBe(100);
    expect(mapped.credits).toBeUndefined();
    expect(mapped.planType).toBeUndefined();
  });

  it("handles NaN/Infinity used_percent by treating as 0", () => {
    const mapped = mapCodexUsageToStatusResponse({
      rate_limit: {
        primary_window: {
          used_percent: NaN,
          reset_at: 1_900_000_000,
          limit_window_seconds: 18000,
        },
        secondary_window: {
          used_percent: Infinity,
          reset_at: 1_900_000_000,
          limit_window_seconds: 604800,
        },
      },
    });

    // NaN is not finite, so raw = 100 - 0 = 100
    expect(mapped.balance.fiveHourUsageLimit.remainingPercent).toBe(100);
    // Infinity is not finite, so raw = 100 - 0 = 100
    expect(mapped.balance.weeklyUsageLimit.remainingPercent).toBe(100);
  });

  it("returns undefined resetAt when reset_at is NaN", () => {
    const mapped = mapCodexUsageToStatusResponse({
      rate_limit: {
        primary_window: {
          used_percent: 50,
          reset_at: NaN,
          limit_window_seconds: 18000,
        },
      },
    });

    expect(mapped.balance.fiveHourUsageLimit.resetAt).toBeUndefined();
  });

  it("handles credits with NaN balance", () => {
    const mapped = mapCodexUsageToStatusResponse({
      credits: {
        has_credits: true,
        unlimited: false,
        balance: NaN,
      },
    });

    expect(mapped.credits?.hasCredits).toBe(true);
    expect(mapped.credits?.balance).toBeUndefined();
  });
});
