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
});
